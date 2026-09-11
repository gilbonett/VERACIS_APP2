import { randomUUID } from 'node:crypto'
import z from 'zod'

export const envSchema = z.object({
  PORT: z.coerce.number().optional().default(3333),
  DATABASE_URL: z.url(),
  REDIS_HOST: z.string().optional().default('127.0.0.1'),
  REDIS_PORT: z.coerce.number().optional().default(6379),
  REDIS_PASSWORD: z.string().optional(),
  AWS_BUCKET_NAME: z.string(),
  AWS_REGION: z.string().default('us-east-1'),
  AWS_ACCESS_KEY_ID: z.string().optional(),
  AWS_SECRET_ACCESS_KEY: z.string().optional(),
  AWS_ENDPOINT: z.string().optional().optional(),

  MAIL_HOST: z.string().optional(),
  MAIL_PORT: z.coerce.number().optional(),
  MAIL_SECURE: z
    .enum(['true', 'false'])
    .transform((val) => val === 'true')
    .default(false),
  MAIL_USER: z.string().optional(),
  MAIL_PASS: z.string().optional(),
  MAIL_FROM_NAME: z.string(),
  MAIL_FROM_EMAIL: z.string(),

  NODE_ENV: z
    .enum(['development', 'production', 'test'])
    .default('development'),
  API_URL: z.url().default('http://localhost:3333'),
  WEB_URL: z.url().default('http://localhost:3000'),
  REDIRECT_LOGIN_URL: z.string().default('http://localhost:3000/auth/login'),
  REDIRECT_RESET_PASSWORD_URL: z
    .string()
    .default('http://localhost:3000/auth/request-password/reset'),
  REDIRECT_FEDERATED_AUTHENTICATED_URL: z
    .string()
    .default('http://localhost:3000/auth/federated/authenticated'),
  REDIRECT_FEDERATED_ONBOARDING_URL: z
    .string()
    .default('http://localhost:3000/auth/federated/onboarding'),
  LOG_LEVEL: z.string().default('warn'),

  TOKEN_SECRET_KEY: z.string(),
  ORIGIN_DOMAIN: z.string().default('http://localhost:3000'),
  COOKIE_DOMAIN: z.string().default('localhost'),
  JWT_PUBLIC_KEY: z.string(),
  JWT_PRIVATE_KEY: z.string(),

  OTEL_SERVICE_NAME: z.string().default('veracis-api'),
  OTEL_EXPORTER_ENDPOINT: z.string(),
  OTEL_AUTH_TOKEN: z.string(),
  PYROSCOPE_EXPORTER_ENDPOINT: z.string().default('http://localhost:4040'),
  PYROSCOPE_HTTP_SAMPLE_RATE: z.coerce.number().min(0).max(1).default(0.1),
  OTEL_SAMPLING_RATIO: z.coerce.number().min(0).max(1).default(0.1),
  DB_SLOW_QUERY_THRESHOLD_MS: z.coerce.number().min(1).optional(),
  DB_POOL_MAX: z.coerce.number().min(1).optional().default(10),

  APP_VERSION: z.string().default('1.0.0'),
  HOSTNAME: z
    .string()
    .optional()
    .default(() => randomUUID()),
  NAMESPACE: z.string().optional().default('veracis'),
  CLOUD_PROVIDER: z.string().optional().default('aws'),
  CLOUD_PLATFORM: z.string().optional().default('aws_ecs'),
  CLOUD_CONTAINER_NAME: z.string().optional().default('veracis-api'),
  REQUEST_TIMEOUT_MS: z.coerce.number().positive().default(30000),
  ENCRYPTION_KEY: z.string(),
})

export type Env = z.infer<typeof envSchema>
