import { describe, it, expect, beforeAll } from 'vitest';
import FormData from 'form-data';
import fs from 'node:fs/promises';
import path from 'node:path';
import { buildApp } from '../src/app.js';
import type { FastifyInstance } from 'fastify';

const FIXTURES = path.join(__dirname, 'fixtures/images');

async function img(name: string): Promise<Buffer> {
  return fs.readFile(path.join(FIXTURES, name));
}

interface MultipartRequest {
  payload: Buffer;
  headers: Record<string, string>;
}

async function buildMultipart(
  files: Record<string, { buffer: Buffer; filename: string; contentType: string }>,
  fields: Record<string, string>
): Promise<MultipartRequest> {
  const form = new FormData();
  for (const [field, file] of Object.entries(files)) {
    form.append(field, file.buffer, { filename: file.filename, contentType: file.contentType });
  }
  for (const [key, value] of Object.entries(fields)) {
    form.append(key, value);
  }
  const payload: Buffer = form.getBuffer();
  return { payload, headers: form.getHeaders() };
}

const SIX_VIEWS = ['front', 'back', 'left', 'right', 'top', 'bottom'];

async function sixViewFiles(): Promise<Record<string, { buffer: Buffer; filename: string; contentType: string }>> {
  const out: Record<string, { buffer: Buffer; filename: string; contentType: string }> = {};
  for (const v of SIX_VIEWS) {
    out[v] = { buffer: await img(`view_${v}.jpg`), filename: `${v}.jpg`, contentType: 'image/jpeg' };
  }
  return out;
}

describe('POST /quality-check (no AI, no persistence)', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp();
  });

  it('returns a structured pass report for good images', async () => {
    const { payload, headers } = await buildMultipart(await sixViewFiles(), { category: 'electronics' });
    const res = await app.inject({ method: 'POST', url: '/quality-check', payload, headers });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.success).toBe(true);
    expect(body.overallPassed).toBe(true);
    expect(body.images).toHaveLength(6);
  });

  it('does not reject a blurry image under quality check bypass', async () => {
    const files = await sixViewFiles();
    files.front = { buffer: await img('blurry.jpg'), filename: 'front.jpg', contentType: 'image/jpeg' };
    const { payload, headers } = await buildMultipart(files, { category: 'electronics' });
    const res = await app.inject({ method: 'POST', url: '/quality-check', payload, headers });
    expect(res.statusCode).toBe(200);
    const body = res.json();
    expect(body.overallPassed).toBe(true);
    const frontReport = body.images.find((i: { view: string }) => i.view === 'front');
    expect(frontReport.failures).toHaveLength(0);
  });
});

describe('POST /grade — structural validation (fails before touching storage)', () => {
  let app: FastifyInstance;
  beforeAll(async () => {
    app = await buildApp();
  });

  it('rejects an unknown image field name', async () => {
    const files = await sixViewFiles();
    files.side_photo = { buffer: await img('sharp_ok.jpg'), filename: 'x.jpg', contentType: 'image/jpeg' };
    const { payload, headers } = await buildMultipart(files, {
      customerId: 'cust-1',
      category: 'electronics',
      returnReason: 'test',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('UNKNOWN_IMAGE_FIELD');
  });

  it('rejects an unsupported mimetype', async () => {
    const files = await sixViewFiles();
    files.front = { buffer: Buffer.from('gif data'), filename: 'front.gif', contentType: 'image/gif' };
    const { payload, headers } = await buildMultipart(files, {
      customerId: 'cust-1',
      category: 'electronics',
      returnReason: 'test',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('UNSUPPORTED_MEDIA_TYPE');
  });

  it('rejects a corrupted / mismatched file whose magic bytes disagree with its extension', async () => {
    const files = await sixViewFiles();
    files.front = { buffer: await img('corrupted.jpg'), filename: 'front.jpg', contentType: 'image/jpeg' };
    const { payload, headers } = await buildMultipart(files, {
      customerId: 'cust-1',
      category: 'electronics',
      returnReason: 'test',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('CORRUPTED_OR_MISMATCHED_FILE');
  });

  it('rejects invalid metadata (missing returnReason)', async () => {
    const { payload, headers } = await buildMultipart(await sixViewFiles(), {
      customerId: 'cust-1',
      category: 'electronics',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_METADATA');
  });

  it('rejects an invalid category enum value', async () => {
    const { payload, headers } = await buildMultipart(await sixViewFiles(), {
      customerId: 'cust-1',
      category: 'not-a-real-category',
      returnReason: 'test',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    expect(res.statusCode).toBe(400);
    expect(res.json().error.code).toBe('INVALID_METADATA');
  });

  it('rejects a request missing required views for the category', async () => {
    const files = await sixViewFiles();
    delete files.back;
    delete files.top;
    const { payload, headers } = await buildMultipart(files, {
      customerId: 'cust-1',
      category: 'electronics',
      returnReason: 'test',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    expect(res.statusCode).toBe(400);
    const body = res.json();
    expect(body.error.code).toBe('MISSING_REQUIRED_VIEWS');
    expect(body.error.details.missingViews).toEqual(expect.arrayContaining(['back', 'top']));
  });

  it('accepts a books submission with only front and back', async () => {
    const buf = await img('sharp_ok.jpg');
    const files = {
      front: { buffer: buf, filename: 'front.jpg', contentType: 'image/jpeg' },
      back: { buffer: buf, filename: 'back.jpg', contentType: 'image/jpeg' },
    };
    const { payload, headers } = await buildMultipart(files, {
      customerId: 'cust-1',
      category: 'books',
      returnReason: 'test',
    });
    const res = await app.inject({ method: 'POST', url: '/grade', payload, headers });
    // Structural + required-views validation passes for books; the request
    // then hits DynamoDB/S3, which aren't running in this environment —
    // asserting it got PAST structural validation is what this suite covers.
    expect(res.statusCode).not.toBe(400);
  });
});
