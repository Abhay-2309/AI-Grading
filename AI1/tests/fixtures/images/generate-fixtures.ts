/**
 * Generates synthetic fixture images for the quality/duplicate validation
 * test suite. Run with `npm run generate:fixtures`. Deterministic (no
 * Math.random) so fixtures are reproducible and can be regenerated anytime.
 */
import sharp from 'sharp';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const DIR = path.dirname(fileURLToPath(import.meta.url));

function noisyBuffer(width: number, height: number, seedFn: (x: number, y: number) => number): Buffer {
  const channels = 3;
  const data = Buffer.alloc(width * height * channels);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      const v = Math.max(0, Math.min(255, Math.round(seedFn(x, y))));
      const idx = (y * width + x) * channels;
      data[idx] = v;
      data[idx + 1] = v;
      data[idx + 2] = v;
    }
  }
  return data;
}

async function writeRaw(name: string, width: number, height: number, seedFn: (x: number, y: number) => number): Promise<void> {
  const raw = noisyBuffer(width, height, seedFn);
  await sharp(raw, { raw: { width, height, channels: 3 } })
    .jpeg({ quality: 90 })
    .toFile(path.join(DIR, name));
}

function checkerboard(x: number, y: number, cell: number): number {
  return (Math.floor(x / cell) + Math.floor(y / cell)) % 2 === 0 ? 220 : 30;
}

function pseudoNoise(x: number, y: number): number {
  const n = Math.sin(x * 12.9898 + y * 78.233) * 43758.5453;
  return ((n - Math.floor(n)) * 255);
}

async function main(): Promise<void> {
  // Sharp, high-contrast, adequately bright — should pass all checks.
  await writeRaw('sharp_ok.jpg', 1200, 1200, (x, y) => checkerboard(x, y, 20));

  // Blurry: low-frequency gradient, no edges -> low Laplacian variance.
  await writeRaw('blurry.jpg', 1200, 1200, (x, y) => 128 + Math.sin(x / 400) * 10);

  // Dark: mean well below the brightness floor.
  await writeRaw('dark.jpg', 1000, 1000, () => 15);

  // Bright / blown out: mean well above the ceiling.
  await writeRaw('bright.jpg', 1000, 1000, () => 245);

  // Low contrast: narrow band around mid-grey.
  await writeRaw('low_contrast.jpg', 1000, 1000, (x, y) => 128 + ((x + y) % 5));

  // Low resolution: below the 800x800 floor.
  await writeRaw('low_res.jpg', 400, 400, (x, y) => checkerboard(x, y, 10));

  // Rotated equivalent of sharp_ok (EXIF orientation applied via metadata).
  await sharp(noisyBuffer(1200, 1200, (x, y) => checkerboard(x, y, 20)), {
    raw: { width: 1200, height: 1200, channels: 3 },
  })
    .withMetadata({ orientation: 6 })
    .jpeg({ quality: 90 })
    .toFile(path.join(DIR, 'rotated.jpg'));

  // Corrupted: valid-looking extension, garbage bytes.
  const fs = await import('node:fs/promises');
  await fs.writeFile(path.join(DIR, 'corrupted.jpg'), Buffer.from('not a real jpeg file', 'utf-8'));

  // Duplicate-detection fixtures.
  await writeRaw('duplicate_exact.jpg', 1000, 1000, pseudoNoise);
  const exactBuf = await sharp(path.join(DIR, 'duplicate_exact.jpg')).jpeg({ quality: 80 }).toBuffer();
  await sharp(exactBuf).toFile(path.join(DIR, 'duplicate_resaved.jpg'));

  await writeRaw('distinct_angle.jpg', 1000, 1000, (x, y) => checkerboard(x + 137, y + 59, 33));
  await writeRaw('similar_symmetric.jpg', 1000, 1000, () => 200); // near-blank, symmetric product

  // Six visually distinct but individually high-quality fixtures, one per
  // view, for intake/e2e tests that need a realistic non-duplicate six-view set.
  const viewOffsets: Record<string, number> = { front: 0, back: 401, left: 802, right: 1203, top: 1604, bottom: 2005 };
  for (const [view, offset] of Object.entries(viewOffsets)) {
    await writeRaw(`view_${view}.jpg`, 1000, 1000, (x, y) => checkerboard(x + offset, y + offset * 2, 27));
  }

  // eslint-disable-next-line no-console
  console.log('Fixtures generated in', DIR);
}

main().catch((err) => {
  // eslint-disable-next-line no-console
  console.error(err);
  process.exit(1);
});
