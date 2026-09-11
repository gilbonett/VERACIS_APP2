import "dotenv/config";

import { IncomingMessage } from "node:http";

import { diag, DiagConsoleLogger, DiagLogLevel } from "@opentelemetry/api";
import { AsyncLocalStorageContextManager } from "@opentelemetry/context-async-hooks";
import {
  CompositePropagator,
  W3CBaggagePropagator,
  W3CTraceContextPropagator,
} from "@opentelemetry/core";
import { OTLPLogExporter } from "@opentelemetry/exporter-logs-otlp-http";
import { OTLPMetricExporter } from "@opentelemetry/exporter-metrics-otlp-http";
import { OTLPTraceExporter } from "@opentelemetry/exporter-trace-otlp-http";
import {
  ExpressInstrumentation,
  ExpressLayerType,
} from "@opentelemetry/instrumentation-express";
import { HttpInstrumentation } from "@opentelemetry/instrumentation-http";
import { PinoInstrumentation } from "@opentelemetry/instrumentation-pino";
import { RuntimeNodeInstrumentation } from "@opentelemetry/instrumentation-runtime-node";
import { resourceFromAttributes } from "@opentelemetry/resources";
import { BatchLogRecordProcessor } from "@opentelemetry/sdk-logs";
import {
  type MetricReader,
  PeriodicExportingMetricReader,
} from "@opentelemetry/sdk-metrics";
import { NodeSDK } from "@opentelemetry/sdk-node";
import {
  AlwaysOnSampler,
  BatchSpanProcessor,
  ParentBasedSampler,
  TraceIdRatioBasedSampler,
} from "@opentelemetry/sdk-trace-base";
import {
  ATTR_DEPLOYMENT_ENVIRONMENT_NAME,
  ATTR_SERVICE_NAME,
  ATTR_SERVICE_VERSION,
} from "@opentelemetry/semantic-conventions";
import { envSchema } from "./infra/env/env";

const env = envSchema.parse(process.env);
const endpoint = env.OTEL_EXPORTER_ENDPOINT;
const isDevelopment = env.NODE_ENV === "development";

if (!process.env.HOSTNAME && env.NODE_ENV === "production") {
  console.warn(
    "[OTEL] HOSTNAME env var not set — service.instance.id will be a random UUID per restart. " +
      "Set HOSTNAME to a stable per-instance identifier (e.g., ECS task ARN).",
  );
}

const otelExporterHostname = (() => {
  try {
    return new URL(endpoint).hostname;
  } catch {
    diag.warn(`GRAFANA_OTEL_EXPORTER_ENDPOINT inválido: ${endpoint}`);
    return undefined;
  }
})();

// Chamadas ao S3/MinIO já geram um span manual rico via @ObserveStorage
// (com peer.service correto). Sem isso, o HttpInstrumentation genérico traça
// a mesma chamada de novo sem peer.service, e o service graph acaba criando
// nós fantasma nomeados pelo host cru (ex.: "localhost" pro MinIO local,
// "*.amazonaws.com" em produção) duplicando o nó "s3" de verdade.
const storageHostname = (() => {
  if (!env.AWS_ENDPOINT) return undefined;
  try {
    return new URL(env.AWS_ENDPOINT).hostname;
  } catch {
    diag.warn(`AWS_ENDPOINT inválido: ${env.AWS_ENDPOINT}`);
    return undefined;
  }
})();

diag.setLogger(
  new DiagConsoleLogger(),
  isDevelopment ? DiagLogLevel.INFO : DiagLogLevel.WARN,
);

const spanProcessors = [
  new BatchSpanProcessor(
    new OTLPTraceExporter({
      url: `${endpoint}/v1/traces`,
      headers: { Authorization: `Bearer ${env.OTEL_AUTH_TOKEN}` },
      timeoutMillis: 10_000,
    }),
    {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5_000,
      exportTimeoutMillis: 10_000,
    },
  ),
];

const metricReaders: MetricReader[] = [
  new PeriodicExportingMetricReader({
    exporter: new OTLPMetricExporter({
      url: `${endpoint}/v1/metrics`,
      headers: { Authorization: `Bearer ${env.OTEL_AUTH_TOKEN}` },
      timeoutMillis: 10_000,
    }),
    exportIntervalMillis: 15_000,
    exportTimeoutMillis: 10_000,
  }),
];

const logRecordProcessors = [
  new BatchLogRecordProcessor(
    new OTLPLogExporter({
      url: `${endpoint}/v1/logs`,
      headers: { Authorization: `Bearer ${env.OTEL_AUTH_TOKEN}` },
      timeoutMillis: 10_000,
    }),
    {
      maxQueueSize: 2048,
      maxExportBatchSize: 512,
      scheduledDelayMillis: 5_000,
      exportTimeoutMillis: 10_000,
    },
  ),
];

export const sdk = new NodeSDK({
  resource: resourceFromAttributes({
    [ATTR_SERVICE_NAME]: env.OTEL_SERVICE_NAME,
    "service.namespace": env.NAMESPACE,
    [ATTR_SERVICE_VERSION]: env.APP_VERSION,
    [ATTR_DEPLOYMENT_ENVIRONMENT_NAME]: env.NODE_ENV,
    "service.instance.id": env.HOSTNAME,
    "cloud.provider": env.CLOUD_PROVIDER,
    "cloud.platform": env.CLOUD_PLATFORM,
    "cloud.region": env.AWS_REGION,
    "container.name": env.CLOUD_CONTAINER_NAME,
    "deployment.version": env.APP_VERSION,
  }),
  logRecordProcessors,
  sampler: isDevelopment
    ? new ParentBasedSampler({ root: new AlwaysOnSampler() })
    : new ParentBasedSampler({
        root: new TraceIdRatioBasedSampler(env.OTEL_SAMPLING_RATIO),
      }),
  spanProcessors,
  metricReaders,
  contextManager: new AsyncLocalStorageContextManager(),
  textMapPropagator: new CompositePropagator({
    propagators: [new W3CTraceContextPropagator(), new W3CBaggagePropagator()],
  }),
  instrumentations: [
    new HttpInstrumentation({
      ignoreIncomingRequestHook: (req) =>
        req.url === "/health" || req.url === "/ping" || req.url === "/metrics",
      requestHook: (span, req) => {
        if (!(req instanceof IncomingMessage)) return;
        const path = (req.url ?? "").split("?")[0] ?? "";
        if (path) span.setAttribute("url.path", path);
        // Instrumentation lib ainda emite semconv HTTP antigo (http.method,
        // http.url, http.status_text) no span raiz — completa com o novo
        // (http.request.method, server.address) pra alimentar RED/Service
        // Graph baseados em semconv atual.
        if (req.method) span.setAttribute("http.request.method", req.method);
        const host = req.headers.host ?? req.headers[":authority"];
        if (host)
          span.setAttribute("server.address", String(host).split(":")[0]);
      },
      responseHook: (span, res) => {
        if (!("statusCode" in res) || res.statusCode === undefined) return;
        span.setAttribute("http.response.status_code", res.statusCode);
      },
      ignoreOutgoingRequestHook: (options) => {
        const host = options.hostname ?? options.host ?? "";
        return (
          host.includes("169.254.") ||
          host.includes("metadata.aws") ||
          host.endsWith("amazonaws.com") ||
          (storageHostname !== undefined && host === storageHostname) ||
          (otelExporterHostname !== undefined &&
            host.includes(otelExporterHostname))
        );
      },
    }),
    new ExpressInstrumentation({
      ignoreLayersType: [ExpressLayerType.MIDDLEWARE],
      requestHook: (span, info) => {
        span.updateName(`${info.request.method} ${info.route}`);
      },
    }),
    new RuntimeNodeInstrumentation({ monitoringPrecision: 5 }),
    new PinoInstrumentation(),
  ],
});

sdk.start();
console.log(`🔭 OpenTelemetry SDK initialized [otlp]`);
