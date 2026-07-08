import 'dotenv/config';
import { z } from 'zod';

const envSchema = z.object({
  PORT: z.coerce.number().int().positive().default(3000),
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  LOG_LEVEL: z.string().default('info'),

  MAX_FILE_SIZE_BYTES: z.coerce.number().int().positive().default(10 * 1024 * 1024),
  MAX_FILES_PER_REQUEST: z.coerce.number().int().positive().default(12),
  IDEMPOTENCY_TTL_SECONDS: z.coerce.number().int().positive().default(86400),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(20),
  RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(60),

  // Fraud Firewall: IP-level velocity limits (separate from the per-customer limiter)
  FRAUD_IP_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(3),
  FRAUD_IP_RATE_LIMIT_WINDOW_SECONDS: z.coerce.number().int().positive().default(900),

  AWS_REGION: z.string().min(1),
  AWS_ACCESS_KEY_ID: z.string().min(1),
  AWS_SECRET_ACCESS_KEY: z.string().min(1),
  S3_BUCKET_NAME: z.string().min(1),
  DYNAMODB_TABLE_NAME: z.string().min(1),
  S3_ENDPOINT: z.string().optional(),
  DYNAMODB_ENDPOINT: z.string().optional(),
  S3_FORCE_PATH_STYLE: z.coerce.boolean().default(false),

  PYTHON_AI_ENGINE_URL: z.string().default('http://127.0.0.1:8000'),
  GEMMA_API_KEY: z.string().min(1),
  GEMMA_MODEL: z.string().default('gemma-3-27b-it'),
  MODEL_TIMEOUT_MS: z.coerce.number().int().positive().default(100000),

  CIRCUIT_BREAKER_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  CIRCUIT_BREAKER_COOLDOWN_MS: z.coerce.number().int().positive().default(120000),

  SWEEPER_INTERVAL_MS: z.coerce.number().int().positive().default(60000),
  SWEEPER_STUCK_THRESHOLD_MS: z.coerce.number().int().positive().default(300000),
});

export type Config = z.infer<typeof envSchema>;

function loadConfig(): Config {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    // eslint-disable-next-line no-console
    console.error('Invalid environment configuration:');
    for (const issue of parsed.error.issues) {
      // eslint-disable-next-line no-console
      console.error(`  - ${issue.path.join('.')}: ${issue.message}`);
    }
    process.exit(1);
  }
  return parsed.data;
}

export const config = loadConfig();
