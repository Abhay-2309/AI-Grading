import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { repairAndValidate } from '../../../src/services/ai/repair.js';

const FIXTURES_DIR = path.join(__dirname, '../../fixtures/model-outputs');

async function loadRawText(filename: string): Promise<string> {
  const fileText = await fs.readFile(path.join(FIXTURES_DIR, filename), 'utf-8');
  const parsed = JSON.parse(fileText);
  return typeof parsed === 'string' ? parsed : JSON.stringify(parsed);
}

describe('repairAndValidate', () => {
  it('accepts already-clean JSON on the first parse', async () => {
    const raw = await loadRawText('clean.json');
    const result = repairAndValidate(raw);
    expect(result.success).toBe(true);
  });

  it('strips markdown code fences', async () => {
    const raw = await loadRawText('fenced.json');
    const result = repairAndValidate(raw);
    expect(result.success).toBe(true);
  });

  it('trims prose surrounding the JSON object', async () => {
    const raw = await loadRawText('prose-wrapped.json');
    const result = repairAndValidate(raw);
    expect(result.success).toBe(true);
  });

  it('coerces stringified numbers and booleans safely', async () => {
    const raw = await loadRawText('string-numbers.json');
    const result = repairAndValidate(raw);
    expect(result.success).toBe(true);
  });

  it('clamps out-of-range confidences into [0,1] instead of rejecting', async () => {
    const raw = await loadRawText('out-of-range.json');
    const result = repairAndValidate(raw);
    expect(result.success).toBe(true);
  });

  it('fails cleanly on truncated JSON with a descriptive error', async () => {
    const raw = await loadRawText('truncated.json');
    const result = repairAndValidate(raw);
    expect(result.success).toBe(false);
    expect(result.errors).toBeTruthy();
  });

  it('fails on completely unparseable garbage', () => {
    const result = repairAndValidate('not json at all {{{');
    expect(result.success).toBe(false);
  });
});
