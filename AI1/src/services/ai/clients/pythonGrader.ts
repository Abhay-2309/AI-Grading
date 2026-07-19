import { config } from '../../../config/config.js';
import { ModelUnavailableError } from '../../../utils/errors.js';
import type { SingleViewDetectionInput, RawModelResponse, VisionGrader } from './types.js';
import { Agent, fetch as undiciFetch, FormData as UndiciFormData } from 'undici';

// Must stay >= config.MODEL_TIMEOUT_MS — undici's own bodyTimeout/headersTimeout
// abort the request independently of (and before) the AbortSignal.timeout()
// below if set lower, silently undercutting whatever MODEL_TIMEOUT_MS is
// configured to allow.
const customDispatcher = new Agent({
  bodyTimeout: config.MODEL_TIMEOUT_MS,
  headersTimeout: config.MODEL_TIMEOUT_MS,
  keepAliveTimeout: 300000
});


/**
 * Adapter function that maps the custom Python FastAPI response schema (V2)
 * back to the expected Gemini/Express schema (Anti-Corruption Layer).
 */
function mapPythonResponseToGeminiSchema(pythonRes: any, view: string) {
  const damages = (pythonRes.raw_detections || []).map((det: any) => {
    // Map YOLO defect type names to corresponding severity level
    let severity: 'Minor' | 'Moderate' | 'High' | 'Critical' = 'Minor';
    const type = det.defect_type;
    
    if (type === 'pcb_defect' || type === 'structural_damage') {
      severity = 'Critical';
    } else if (type === 'crack') {
      severity = 'High';
    } else if (type === 'dent' || type === 'hole_tear') {
      severity = 'Moderate';
    } else if (type === 'scratch' || type === 'stain') {
      severity = 'Minor';
    }

    // Map box coordinate array [x1, y1, x2, y2] to { x, y, width, height } bounding box format
    let boundingBox = undefined;
    if (Array.isArray(det.box) && det.box.length === 4) {
      const clamp = (v: number) => Math.max(0, Math.min(1000, v));
      const x1 = clamp(det.box[0]);
      const y1 = clamp(det.box[1]);
      const x2 = clamp(det.box[2]);
      const y2 = clamp(det.box[3]);
      
      boundingBox = {
        x: x1,
        y: y1,
        width: clamp(x2 - x1),
        height: clamp(y2 - y1)
      };
    }

    return {
      type: det.defect_type,
      severity,
      view: view,
      location: 'general area',
      description: `Detected ${det.defect_type.replace('_', ' ')} with confidence ${Math.round(det.confidence * 100)}%`,
      confidence: det.confidence,
      boundingBox,
      source: 'visual'
    };
  });

  // Check if messages contains fraud/mismatch indications
  const mismatchMsg = (pythonRes.messages || []).find((m: string) => 
    m.toLowerCase().includes('mismatch') || m.toLowerCase().includes('fraud')
  );
  const itemMatchesCategory = !mismatchMsg;

  // Map semantic/visual characteristics to visibilityIssues
  const visibilityIssues: string[] = [];
  if (pythonRes.semantic_features?.has_heavy_dirt) {
    visibilityIssues.push('Heavy dirt/stains visible on item surface');
  }
  if (pythonRes.semantic_features?.screen_cracked_visible) {
    visibilityIssues.push('Significant screen/casing cracking visible');
  }

  // Map image quality score
  let imageQualityScore = 0.95;
  if (pythonRes.semantic_features?.has_heavy_dirt) {
    imageQualityScore = 0.85;
  }

  return {
    damages,
    itemMatchesCategory,
    categoryMismatchReason: mismatchMsg,
    visibilityIssues,
    imageQualityScore
  };
}

export class PythonGrader implements VisionGrader {
  readonly name = 'python' as const;

  constructor(private readonly engineUrl = config.PYTHON_AI_ENGINE_URL) {}

  async detectSingleView(input: SingleViewDetectionInput): Promise<RawModelResponse> {
    const cleanEngineUrl = this.engineUrl.replace(/\/$/, '');
    const isHuggingFace = cleanEngineUrl.includes('hf.space') || cleanEngineUrl.includes('huggingface.co');

    if (isHuggingFace) {
      // Use Hugging Face Gradio JSON API endpoint
      const url = `${cleanEngineUrl}/api/predict`;
      const base64Image = `data:${input.image.mimetype};base64,${input.image.buffer.toString('base64')}`;
      
      const payload = {
        data: [
          base64Image,
          input.category,
          input.returnReason || 'P2P Sale',
          input.customerNotes || 'Listing Verification'
        ]
      };

      try {
        const response = await undiciFetch(url, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(payload),
          dispatcher: customDispatcher,
          signal: AbortSignal.timeout(config.MODEL_TIMEOUT_MS)
        });

        if (!response.ok) {
          throw new Error(`Gradio engine returned status ${response.status}`);
        }

        const jsonRes = await response.json() as any;
        if (!jsonRes || !jsonRes.data || !Array.isArray(jsonRes.data) || jsonRes.data.length === 0) {
          throw new Error('Gradio engine returned empty or invalid data array');
        }

        const pythonRes = jsonRes.data[0];
        const mappedReport = mapPythonResponseToGeminiSchema(pythonRes, input.image.view);

        return {
          modelUsed: 'python',
          text: JSON.stringify(mappedReport)
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new ModelUnavailableError(`Gradio AI engine is unreachable or returned an error.`, { cause: msg });
      }
    } else {
      // Fallback to standard FastAPI multipart endpoint for local execution
      const url = `${cleanEngineUrl}/api/v1/evaluate/disposition`;
      const formData = new UndiciFormData();
      formData.append('source', 'sell');
      formData.append('claimed_category', input.category);
      formData.append('gatekeeper_answers', JSON.stringify({})); // Empty survey fallback

      formData.append(
        'image',
        new Blob([input.image.buffer], { type: input.image.mimetype }),
        `image_${input.image.view}.jpg`
      );

      try {
        const response = await undiciFetch(url, {
          method: 'POST',
          body: formData,
          dispatcher: customDispatcher,
          signal: AbortSignal.timeout(config.MODEL_TIMEOUT_MS)
        });

        if (!response.ok) {
          throw new Error(`Python engine returned status ${response.status}`);
        }

        const pythonRes = await response.json();
        const mappedReport = mapPythonResponseToGeminiSchema(pythonRes, input.image.view);

        return {
          modelUsed: 'python',
          text: JSON.stringify(mappedReport)
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : String(err);
        throw new ModelUnavailableError(`Python AI engine is unreachable or returned an error.`, { cause: msg });
      }
    }
  }
}
