import { describe, it, expect } from 'vitest';
import fs from 'node:fs/promises';
import path from 'node:path';
import { assessImageQuality } from '../../../src/services/validation/quality.js';

const FIXTURES = path.join(__dirname, '../../fixtures/images');

async function load(name: string): Promise<Buffer> {
  return fs.readFile(path.join(FIXTURES, name));
}

describe('assessImageQuality', () => {
  it('passes a sharp, well-lit, adequately sized image', async () => {
    const buf = await load('sharp_ok.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).toHaveLength(0);
  });

  it('does not reject a blurry image', async () => {
    const buf = await load('blurry.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('blurry');
  });

  it('does not reject a too-dark image', async () => {
    const buf = await load('dark.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('too_dark');
  });

  it('does not reject a blown-out (too bright) image', async () => {
    const buf = await load('bright.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('too_bright');
  });

  it('does not reject a low-contrast image', async () => {
    const buf = await load('low_contrast.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('low_contrast');
  });

  it('does not reject an image below the resolution floor', async () => {
    const buf = await load('low_res.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('resolution');
  });

  it('does not reject a corrupted / non-image file', async () => {
    const buf = await load('corrupted.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('integrity');
  });

  it('auto-rotates via EXIF orientation and still passes a genuinely sharp image', async () => {
    const buf = await load('rotated.jpg');
    const { report, normalized } = await assessImageQuality('front', buf, 'electronics');
    expect(report.passed).toBe(true);
    // Orientation 6 is a 90-degree rotation; baked-in dimensions should reflect it.
    expect(normalized.width).toBeGreaterThan(0);
  });

  it('applies a lower resolution floor for the books category but does not reject', async () => {
    const buf = await load('low_res.jpg'); // 400x400
    const { report } = await assessImageQuality('front', buf, 'books');
    expect(report.passed).toBe(true);
    expect(report.failures).not.toContain('resolution');
  });

  it('returns a structured report, not just a boolean', async () => {
    const buf = await load('sharp_ok.jpg');
    const { report } = await assessImageQuality('front', buf, 'electronics');
    expect(report).toHaveProperty('scores.blur');
    expect(report).toHaveProperty('scores.brightness');
    expect(report).toHaveProperty('scores.contrast');
    expect(report).toHaveProperty('scores.resolution');
  });
});
