import { detectionResultSchema, type DetectionResult } from '../../schemas/grading-report.schema.js';
import { logger } from '../../utils/logger.js';

export interface RepairResult {
  success: boolean;
  report?: DetectionResult;
  errors?: string;
}

function extractLastJsonObject(text: string): string | null {
  const lastBrace = text.lastIndexOf('}');
  if (lastBrace === -1) return null;

  let depth = 0;
  for (let i = lastBrace; i >= 0; i--) {
    if (text[i] === '}') depth++;
    else if (text[i] === '{') {
      depth--;
      if (depth === 0) return text.slice(i, lastBrace + 1);
    }
  }
  return null;
}

function coerce(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(coerce);
  if (value !== null && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value as Record<string, unknown>)) {
      out[k] = coerce(v);
    }
    return out;
  }
  if (typeof value === 'string') {
    if (value === 'TRUE') return true;
    if (value === 'FALSE') return false;
    if (/^-?\d+(\.\d+)?$/.test(value)) return Number(value);
  }
  return value;
}

function normalizeDamages(obj: Record<string, unknown>): void {
  if (Array.isArray(obj.damages)) {
    for (const d of obj.damages) {
      if (d && typeof d === 'object') {
        const dd = d as Record<string, unknown>;
        if (typeof dd.confidence === 'number') {
          dd.confidence = Math.min(1, Math.max(0, dd.confidence));
        }
        if (typeof dd.severity === 'string') {
          if (dd.severity === 'Low') dd.severity = 'Minor';
          else if (dd.severity === 'Medium') dd.severity = 'Moderate';
          else if (dd.severity === 'Severe') dd.severity = 'High';
        }
        if (dd.boundingBox && typeof dd.boundingBox === 'object') {
          const bb = dd.boundingBox as Record<string, number | undefined>;
          const x = bb.x ?? 0;
          const y = bb.y ?? 0;
          const w = bb.width ?? 0;
          const h = bb.height ?? 0;
          if (x > 1 || y > 1 || w > 1 || h > 1) {
            dd.boundingBox = {
              x: Math.min(1, Math.max(0, x > 1 ? x / 1000 : x)),
              y: Math.min(1, Math.max(0, y > 1 ? y / 1000 : y)),
              width: Math.min(1, Math.max(0, w > 1 ? w / 1000 : w)),
              height: Math.min(1, Math.max(0, h > 1 ? h / 1000 : h)),
            };
          }
        }
      }
    }
  }
  if (typeof obj.imageQualityScore === 'number') {
    obj.imageQualityScore = Math.min(1, Math.max(0, obj.imageQualityScore));
  }
}

export function repairAndValidate(rawText: string): RepairResult {
  let parsed: unknown;
  try {
    parsed = JSON.parse(rawText.trim());
  } catch {
    const extracted = extractLastJsonObject(rawText);
    if (extracted === null) {
      logger.warn({ event: 'modelOutputUnparseable', rawTextSnippet: rawText.slice(-1000) }, 'no JSON object found in model output');
      return { success: false, errors: 'No JSON object found in model output (no balanced {...} present).' };
    }
    try {
      parsed = JSON.parse(extracted);
    } catch (err) {
      logger.warn({ event: 'modelOutputUnparseable', errors: String(err), rawTextSnippet: rawText.slice(-1000) }, 'extracted JSON object still failed to parse');
      return { success: false, errors: `Unparseable JSON even after extracting the last balanced object: ${String(err)}` };
    }
  }

  if (parsed !== null && typeof parsed === 'object') {
    parsed = coerce(parsed);
    normalizeDamages(parsed as Record<string, unknown>);
  }

  const result = detectionResultSchema.safeParse(parsed);
  if (result.success) {
    return { success: true, report: result.data };
  }

  const errors = result.error.errors.map((e) => `${e.path.join('.')}: ${e.message}`).join('; ');
  logger.warn({ event: 'modelOutputValidationFailed', errors, rawTextSnippet: rawText.slice(-1000) }, 'model output failed validation');
  return { success: false, errors };
}
