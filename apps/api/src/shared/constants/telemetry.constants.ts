// ─── Tracer names ─────────────────────────────────────────────────────────────
// Cada módulo tem seu próprio tracer isolado no backend de observabilidade.
// Use esses nomes ao chamar trace.getTracer() / getMeter() em cada serviço.

export const TRACER_NAMES = {
  CACHE: "cache-module",
  EVENTS: "events-module",
  QUEUE: "queue-module",
  DATABASE: "database-module",
  HTTP: "http-module",
  BUSINESS: "business-module",
  STORAGE: "storage-module",
  CRYPTOGRAPHY: "cryptography-module",
  MAIL: "mail-module",
  GUARD: "guard-module",
  RATE_LIMIT: "rate-limit-module",
  REALTIME: "realtime-module",
} as const;

export const PEER_SERVICE = {
  POSTGRESQL: "postgresql",
  REDIS: "redis",
  BULLMQ: "bullmq",
  S3: "s3",
  MINIO: "minio",
  SMTP: "smtp",
  DOMAIN_EVENTS: "domain-events",
} as const;

// ─── Business vocabulary ──────────────────────────────────────────────────────
// Vocabulário controlado — cada par (flow, action) único cria uma nova time series.
// NUNCA passe strings dinâmicas, IDs de usuário ou valores vindos do request.

export type BusinessFlow = "alert" | "auth" | "mail" | "session";

export type BusinessAction =
  | "create"
  | "accept"
  | "close"
  | "expire"
  | "resolve"
  | "send"
  | "verify";

// ─── Span names ───────────────────────────────────────────────────────────────

export const CACHE_SPANS = {
  SET: "cache.set",
  GET: "cache.get",
  DELETE: "cache.delete",
} as const;

export const EVENTS_SPANS = {
  PUBLISH: "events.publish",
  SUBSCRIBE: "events.subscribe",
  HANDLER: "events.handler",
} as const;

export const QUEUE_SPANS = {
  ADD: "queue.add",
  PROCESS: "queue.process",
  RETRY: "queue.retry",
  FAILED: "queue.failed",
} as const;

export const DATABASE_SPANS = {
  QUERY: "db.query",
  TRANSACTION: "db.transaction",
} as const;

export const STORAGE_SPANS = {
  UPLOAD: "storage.upload",
  GET_FILE: "storage.get_file",
} as const;

export const REALTIME_SPANS = {
  PUBLISH: "realtime.publish",
} as const;

// ─── Metric names ─────────────────────────────────────────────────────────────
// Nomes alinhados com OpenTelemetry Semantic Conventions onde aplicável.
// Métricas genéricas de infra (Redis, PostgreSQL server-side) NÃO ficam aqui —
// são coletadas nativamente pelo OTel Collector (ver infra/otel/config.yaml,
// receivers `redis` e `postgresql`). Aqui só entram métricas que só o
// processo da aplicação pode ver (client-side pool, query duration por
// operação, hit/miss de cache por keyPrefix, etc).

export const CACHE_METRICS = {
  OPERATION_DURATION: "cache.operation.duration",
  HIT_TOTAL: "cache.hit.total",
  MISS_TOTAL: "cache.miss.total",
  ERROR_TOTAL: "cache.error.total",
} as const;

export const EVENTS_METRICS = {
  PUBLISH_TOTAL: "events.publish.total",
  CONSUMED_TOTAL: "events.consumed.total",
  HANDLER_DURATION: "events.handler.duration",
  ERROR_TOTAL: "events.error.total",
} as const;

export const QUEUE_METRICS = {
  JOBS_PROCESSED: "bullmq.jobs.processed",
  // Toda tentativa que lança erro, tenha ou não retries restantes —
  // permite calcular taxa de retry (jobs_failed - jobs_moved_to_dlq).
  JOBS_FAILED: "bullmq.jobs.failed",
  JOBS_MOVED_TO_DLQ: "bullmq.jobs.moved_to_dlq",
  JOBS_STALLED: "bullmq.jobs.stalled",
  JOB_DURATION: "bullmq.job.duration.seconds",
  JOB_WAIT: "bullmq.job.wait.seconds",
  QUEUE_SIZE: "bullmq.queue.size",
} as const;

export const DATABASE_METRICS = {
  // Alinhado com semconv db.client.operation.duration
  QUERY_DURATION: "db.client.operation.duration",
  SLOW_QUERIES_TOTAL: "db.client.slow_queries.total",
  POOL_TOTAL: "db.client.connections.pool.total",
  POOL_IDLE: "db.client.connections.pool.idle",
  POOL_WAITING: "db.client.connections.pool.waiting",
  POOL_MAX: "db.client.connections.pool.max",
} as const;

export const HTTP_METRICS = {
  // Alinhado com semconv http.server.request.duration e http.server.active_requests
  REQUEST_DURATION: "http.server.request.duration",
  REQUEST_ACTIVE: "http.server.active_requests",
} as const;

export const BUSINESS_METRICS = {
  FLOW_DURATION: "business.flow.duration.seconds",
  ACTION_TOTAL: "business.action.total",
} as const;

export const STORAGE_METRICS = {
  OPERATION_DURATION: "storage.operation.duration",
  OPERATION_SIZE_BYTES: "storage.operation.size_bytes",
  ERROR_TOTAL: "storage.error.total",
} as const;

export const MAIL_METRICS = {
  SEND_DURATION: "mail.send.duration",
  SEND_TOTAL: "mail.send.total",
  ERROR_TOTAL: "mail.error.total",
} as const;

export const CRYPTOGRAPHY_METRICS = {
  OPERATION_DURATION: "cryptography.operation.duration",
  HMAC_DURATION: "cryptography.hmac.duration",
  ERROR_TOTAL: "cryptography.error.total",
} as const;

export const RATE_LIMIT_METRICS = {
  THROTTLED_TOTAL: "http.requests.throttled.total",
} as const;

export const REALTIME_METRICS = {
  PUBLISH_DURATION: "realtime.publish.duration",
  PUBLISH_TOTAL: "realtime.publish.total",
  ERROR_TOTAL: "realtime.error.total",
} as const;

// ─── Attribute keys ───────────────────────────────────────────────────────────
// Alinhados com OpenTelemetry Semantic Conventions onde há convenção oficial.
// Atributos de domínio customizados usam prefixo 'app.' para evitar colisão.

export const CACHE_ATTRS = {
  OPERATION: "cache.operation",
  KEY_PREFIX: "cache.key.prefix",
  HIT: "cache.hit",
  TTL: "cache.ttl",
  ERROR_TYPE: "cache.error.type",
} as const;

export const EVENTS_ATTRS = {
  TOPIC: "events.topic",
  PAYLOAD_SIZE: "events.payload.size",
  HANDLER: "events.handler",
  ERROR_TYPE: "events.error.type",
} as const;

export const QUEUE_ATTRS = {
  // Alinhado com semconv messaging.*
  QUEUE: "messaging.destination.name", // nome da fila
  // era "messaging.operation.name" — colidia com o semconv (que espera
  // valores como "publish"/"process", não o nome do job de negócio).
  JOB_NAME: "messaging.bullmq.job.name", // customizado com prefixo
  JOB_ID: "messaging.message.id", // id do job
  ATTEMPT: "messaging.bullmq.attempt", // customizado com prefixo
  STATE: "messaging.bullmq.state", // customizado com prefixo
  ERROR: "messaging.bullmq.error", // customizado com prefixo
} as const;

export const DATABASE_ATTRS = {
  // Alinhado com semconv db.*
  MODEL: "db.collection.name", // era db.model
  OPERATION: "db.operation.name", // era db.operation
  ERROR_TYPE: "db.error.type",
} as const;

export const HTTP_ATTRS = {
  // Alinhado com semconv http.*
  ROUTE: "http.route",
  METHOD: "http.request.method", // semconv usa http.request.method
  STATUS_CODE: "http.response.status_code", // semconv usa http.response.status_code
  // Atributos de domínio customizados — prefixo app. para não colidir
  USER_ID: "app.user.id",
  REQUEST_ID: "app.request.id",
  DURATION: "http.duration_ms",
  // Substituem o que o NestInstrumentation dava (desligado — criava span
  // duplicado por request). Só atributo no span existente, sem span novo.
  CONTROLLER: "app.controller",
  HANDLER: "app.handler",
} as const;

export const BUSINESS_ATTRS = {
  FLOW: "business.flow",
  ACTION: "business.action",
  RESULT: "business.result",
} as const;

export const MAIL_ATTRS = {
  TEMPLATE: "mail.template",
  ERROR_TYPE: "mail.error.type",
} as const;

export const CRYPTOGRAPHY_ATTRS = {
  OPERATION: "cryptography.operation",
  ERROR_TYPE: "cryptography.error.type",
} as const;

export const STORAGE_ATTRS = {
  OPERATION: "storage.operation",
  FILE_TYPE: "storage.file.type",
  BUCKET: "aws.s3.bucket", // semconv usa aws.s3.bucket
  ERROR_TYPE: "storage.error.type",
} as const;

export const GUARD_ATTRS = {
  NAME: "app.guard.name",
  USER_ID: "app.guard.user.id",
} as const;

export const RATE_LIMIT_ATTRS = {
  THROTTLER_NAME: "rate_limit.throttler_name",
  ROUTE: "rate_limit.route",
} as const;

export const REALTIME_ATTRS = {
  CHANNEL: "realtime.channel",
  SCOPE: "realtime.scope",
  ERROR_TYPE: "realtime.error.type",
} as const;
