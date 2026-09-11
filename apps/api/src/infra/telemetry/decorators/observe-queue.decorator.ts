import {
  PEER_SERVICE,
  QUEUE_ATTRS,
  TRACER_NAMES,
} from "@/shared/constants/telemetry.constants";
import { Logger } from "@nestjs/common";

import {
  context,
  propagation,
  SpanKind,
  SpanStatusCode,
  trace,
} from "@opentelemetry/api";
import { Job } from "bullmq";
// import { QueueMetricsService } from "../services/queue-metrics.service";

export type QueueOperation = "add" | "process" | "retry";

export interface ObserveQueueOptions {
  operation: QueueOperation;
  queue: string;
  jobName: string;
}

const SPAN_KIND: Record<QueueOperation, SpanKind> = {
  add: SpanKind.PRODUCER,
  process: SpanKind.CONSUMER,
  retry: SpanKind.CONSUMER,
};

const JOB_TRACE_LINK_DELAY_MS = 30_000;

function getJobSpanOptions(job: Job) {
  const parentCtx = job.data?.__otel
    ? propagation.extract(context.active(), job.data.__otel)
    : context.active();

  const parentSpanContext = trace.getSpanContext(parentCtx);
  const delay = typeof job.opts?.delay === "number" ? job.opts.delay : 0;
  const root = delay >= JOB_TRACE_LINK_DELAY_MS;
  const links =
    root && parentSpanContext ? [{ context: parentSpanContext }] : undefined;

  return { parentCtx, root, links };
}

export function ObserveQueue(opts: ObserveQueueOptions): MethodDecorator {
  return (target, propertyKey, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;
    const className = target.constructor.name;
    const methodName = String(propertyKey);
    const spanKind = SPAN_KIND[opts.operation];
    const logger = new Logger(className);
    const tracer = trace.getTracer(TRACER_NAMES.QUEUE);
    const spanName = `${className} [${methodName}]`;

    descriptor.value = async function (...args: unknown[]) {
      // const metrics = TelemetryRegistry.get(QueueMetricsService);

      // ── PRODUCER (add) ──────────────────────────────────────────────────
      // Injeta __otel no payload (args[1]) automaticamente.
      // O dispatcher não precisa chamar withTraceContext.
      if (opts.operation === "add") {
        return tracer.startActiveSpan(
          spanName,
          {
            kind: spanKind,
            attributes: {
              "peer.service": PEER_SERVICE.BULLMQ,
              "messaging.system": "bullmq",
              "messaging.operation": "publish",
              [QUEUE_ATTRS.QUEUE]: opts.queue,
              [QUEUE_ATTRS.JOB_NAME]: opts.jobName,
            },
          },
          async (span) => {
            // Injeta contexto W3C no payload — args[1] é o payload do queue.add()
            const carrier: Record<string, string> = {};
            propagation.inject(context.active(), carrier);

            const injectedArgs = [...args];
            if (injectedArgs[1] && typeof injectedArgs[1] === "object") {
              injectedArgs[1] = {
                ...(injectedArgs[1] as object),
                __otel: carrier,
              };
            }

            try {
              const result = await original.apply(this, injectedArgs);
              span.setStatus({ code: SpanStatusCode.OK });
              return result;
            } catch (err) {
              const error = err instanceof Error ? err : new Error(String(err));
              span.recordException(error);
              span.setStatus({
                code: SpanStatusCode.ERROR,
                message: error.message,
              });
              span.setAttribute(QUEUE_ATTRS.ERROR, error.message);
              logger.error(`✗ ${spanName}`, {
                queue: opts.queue,
                jobName: opts.jobName,
                error: error.message,
                traceId: span.spanContext().traceId,
              });
              throw err;
            } finally {
              span.end();
            }
          },
        );
      }

      // ── CONSUMER (process / retry) ───────────────────────────────────────
      // Extrai contexto W3C do payload — mantém cadeia de trace do dispatcher.
      // Jobs com delay >= 30s viram root spans com link para o trace original.
      const job = args[0] as Job;
      const { parentCtx, root, links } = getJobSpanOptions(job);

      const span = tracer.startSpan(
        spanName,
        {
          kind: spanKind,
          root,
          links,
          attributes: {
            "peer.service": PEER_SERVICE.BULLMQ,
            "messaging.system": "bullmq",
            "messaging.operation": "process",
            [QUEUE_ATTRS.QUEUE]: opts.queue,
            [QUEUE_ATTRS.JOB_NAME]: job.name,
            [QUEUE_ATTRS.JOB_ID]: job.id ?? "",
            [QUEUE_ATTRS.ATTEMPT]: job.attemptsMade,
          },
        },
        parentCtx,
      );

      const traceId = span.spanContext().traceId;

      return context.with(trace.setSpan(parentCtx, span), async () => {
        logger.log(`▶ ${spanName}`, {
          job: job.name,
          jobId: job.id,
          queue: opts.queue,
          attempt: job.attemptsMade,
          traceId,
        });

        try {
          const result = await original.apply(this, args);

          // metrics.recordCompleted(
          //   { queue: opts.queue, job_name: job.name },
          //   job,
          // );
          span.setStatus({ code: SpanStatusCode.OK });
          return result;
        } catch (err) {
          const error = err instanceof Error ? err : new Error(String(err));
          span.recordException(error);
          span.setStatus({
            code: SpanStatusCode.ERROR,
            message: error.message,
          });
          span.setAttribute(QUEUE_ATTRS.ERROR, error.constructor.name);
          logger.error(`✗ ${spanName}`, {
            job: job.name,
            jobId: job.id,
            queue: opts.queue,
            attempt: job.attemptsMade,
            error: error.message,
            traceId,
          });
          throw err;
        } finally {
          span.end();
        }
      });
    };

    Reflect.getMetadataKeys(original).forEach((key) => {
      Reflect.defineMetadata(
        key,
        Reflect.getMetadata(key, original),
        descriptor.value,
      );
    });
    return descriptor;
  };
}
