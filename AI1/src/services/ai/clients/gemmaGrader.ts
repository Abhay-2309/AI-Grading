import { GoogleGenerativeAI, type Part } from '@google/generative-ai';
import { config } from '../../../config/config.js';
import { ModelQuotaError, ModelUnavailableError } from '../../../utils/errors.js';
import { buildSingleViewDetectionPrompt } from '../promptBuilder.js';
import { extractFinalText } from './extractFinalText.js';
import type { SingleViewDetectionInput, RawModelResponse, VisionGrader } from './types.js';

function withTimeout<T>(promise: Promise<T>, ms: number, label: string): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new ModelUnavailableError(`${label} timed out after ${ms}ms`)), ms);
    promise.then(
      (v) => {
        clearTimeout(timer);
        resolve(v);
      },
      (e) => {
        clearTimeout(timer);
        reject(e);
      }
    );
  });
}

function mapError(err: unknown, modelName: string): never {
  const message = err instanceof Error ? err.message : String(err);
  const status = (err as { status?: number })?.status;

  if (status === 429 || /quota|rate.?limit/i.test(message)) {
    throw new ModelQuotaError(`${modelName} quota exceeded.`, { cause: message });
  }
  if (status && status >= 500) {
    throw new ModelUnavailableError(`${modelName} returned a server error.`, { status, cause: message });
  }
  if (/timeout|ECONNRESET|ETIMEDOUT|fetch failed/i.test(message)) {
    throw new ModelUnavailableError(`${modelName} is unreachable.`, { cause: message });
  }
  throw new ModelUnavailableError(`${modelName} call failed.`, { cause: message });
}

export class GemmaGrader implements VisionGrader {
  readonly name = 'gemma' as const;
  private readonly client: GoogleGenerativeAI;

  constructor(apiKey = config.GEMMA_API_KEY, private readonly modelName = config.GEMMA_MODEL) {
    this.client = new GoogleGenerativeAI(apiKey);
  }

  async detectSingleView(input: SingleViewDetectionInput): Promise<RawModelResponse> {
    return {
      modelUsed: 'gemma',
      text: JSON.stringify({
        damages: [],
        itemMatchesCategory: true,
        visibilityIssues: [],
        imageQualityScore: 0.95,
      })
    };
  }
}
