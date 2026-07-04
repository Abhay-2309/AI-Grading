import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
} from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import sharp from 'sharp';
import { config } from '../../config/config.js';
import { StorageError } from '../../utils/errors.js';

const s3 = new S3Client({
  region: config.AWS_REGION,
  credentials: {
    accessKeyId: config.AWS_ACCESS_KEY_ID,
    secretAccessKey: config.AWS_SECRET_ACCESS_KEY,
  },
  endpoint: config.S3_ENDPOINT,
  forcePathStyle: config.S3_FORCE_PATH_STYLE,
});

const BUCKET = config.S3_BUCKET_NAME;
const ANALYSIS_MAX_EDGE = 1568;
const THUMB_MAX_EDGE = 320;

export type Variant = 'original' | 'analysis' | 'thumbs' | 'rejected';

export function buildKey(requestId: string, variant: Variant, view: string, ext = 'jpg'): string {
  return `returns-grading/${requestId}/${variant}/${view}.${ext}`;
}

async function putObject(key: string, body: Buffer, contentType: string): Promise<void> {
  try {
    await s3.send(
      new PutObjectCommand({ Bucket: BUCKET, Key: key, Body: body, ContentType: contentType })
    );
  } catch (err) {
    throw new StorageError(`Failed to upload object to S3: ${key}`, { key, cause: String(err) });
  }
}

export async function uploadOriginal(requestId: string, view: string, buffer: Buffer, mimetype: string): Promise<string> {
  const ext = mimetype.split('/')[1] ?? 'jpg';
  const key = buildKey(requestId, 'original', view, ext);
  await putObject(key, buffer, mimetype);
  return key;
}

export async function uploadRejected(requestId: string, view: string, buffer: Buffer, mimetype: string): Promise<string> {
  const ext = mimetype.split('/')[1] ?? 'jpg';
  const key = buildKey(requestId, 'rejected', view, ext);
  await putObject(key, buffer, mimetype);
  return key;
}

/** Downscales for what the VLM actually sees — saves upload time/tokens with no accuracy loss. */
export async function uploadAnalysisVariant(requestId: string, view: string, buffer: Buffer): Promise<string> {
  const resized = await sharp(buffer)
    .rotate()
    .resize({ width: ANALYSIS_MAX_EDGE, height: ANALYSIS_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer();
  const key = buildKey(requestId, 'analysis', view, 'jpg');
  await putObject(key, resized, 'image/jpeg');
  return key;
}

export async function uploadThumbnail(requestId: string, view: string, buffer: Buffer): Promise<string> {
  const resized = await sharp(buffer)
    .rotate()
    .resize({ width: THUMB_MAX_EDGE, height: THUMB_MAX_EDGE, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 70 })
    .toBuffer();
  const key = buildKey(requestId, 'thumbs', view, 'jpg');
  await putObject(key, resized, 'image/jpeg');
  return key;
}

export async function getObjectBuffer(key: string): Promise<Buffer> {
  try {
    const res = await s3.send(new GetObjectCommand({ Bucket: BUCKET, Key: key }));
    const bytes = await res.Body?.transformToByteArray();
    if (!bytes) throw new Error('empty body');
    return Buffer.from(bytes);
  } catch (err) {
    throw new StorageError(`Failed to fetch object from S3: ${key}`, { key, cause: String(err) });
  }
}

/** Never store signed URLs — keys only. Regenerate at read time; they expire. */
export async function getPresignedUrl(key: string, expiresInSeconds = 900): Promise<string> {
  try {
    const command = new GetObjectCommand({ Bucket: BUCKET, Key: key });
    return await getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
  } catch (err) {
    throw new StorageError(`Failed to sign URL for object: ${key}`, { key, cause: String(err) });
  }
}

export { s3, BUCKET };
