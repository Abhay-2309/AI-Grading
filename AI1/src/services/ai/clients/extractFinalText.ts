import type { GenerateContentResult, Part } from '@google/generative-ai';

// The installed SDK's TypeScript types predate the "thinking" feature and
// don't declare `thought` on Part, even though the API sets it on the wire
// for reasoning models (confirmed directly against gemma-4-26b-a4b-it: the
// response comes back as two parts, one with `"thought": true` holding the
// full chain-of-thought, one plain holding the actual answer).
type ThoughtAwarePart = Part & { thought?: boolean };

/**
 * The SDK's `response.text()` naively concatenates every part, including
 * thought parts — that's the real reason reasoning-model output (e.g. Gemma)
 * looked like prose-wrapped JSON: it wasn't the model ignoring instructions,
 * it was us reading its scratch work back as if it were the answer. Filtering
 * on `thought !== true` here is a structural fix at the source, upstream of
 * the repair layer's text-extraction fallback (which stays as defense in
 * depth for any prose the model does add to its actual answer part).
 */
export function extractFinalText(result: GenerateContentResult): string {
  const parts = (result.response.candidates?.[0]?.content?.parts ?? []) as ThoughtAwarePart[];
  const finalParts = parts.filter((p) => p.thought !== true && typeof p.text === 'string');

  if (finalParts.length > 0) {
    return finalParts.map((p) => p.text).join('');
  }

  // No structured parts (or every part was flagged thought) — fall back to
  // the SDK's own text() so we still get something for the repair layer.
  return result.response.text();
}
