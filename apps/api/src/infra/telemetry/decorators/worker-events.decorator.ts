import { Logger } from "@nestjs/common";
import { Job } from "bullmq";
// import { QueueMetricsService } from "../services/queue-metrics.service";

const logger = new Logger("QueueWorkerEvents");

interface WorkerDeps {
  queueName: string;
  dlq: { add: (...args: unknown[]) => Promise<unknown> };
}

/**
 * Sanitiza o payload do job antes de mover para DLQ.
 * Remove __otel (contexto W3C) e dados sensíveis por job.
 */
function sanitizeJobData(
  jobName: string,
  data: Record<string, unknown>,
): Record<string, unknown> {
  const { __otel: _otel, ...rest } = data;

  // Remove código OTP — dado sensível que não deve ir para DLQ
  if (jobName === "send-otp-code") {
    const { code: _code, ...safe } = rest as { code?: unknown };
    return safe;
  }

  return rest;
}

/**
 * Decorator semântico para onCompleted.
 * O @ObserveQueue já registra recordCompleted — este decorator
 * só serve para deixar o método declarativo e consistente.
 *
 * @example
 * @OnWorkerEvent("completed")
 * @RecordCompleted()
 * onCompleted(_job: Job): void {}
 */
export function RecordCompleted(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = function (this: WorkerDeps, job: Job): void {
      logger.log("Job completed", {
        job: job.name,
        jobId: job.id,
        queue: this.queueName,
      });
      original.call(this, job);
    };

    return descriptor;
  };
}

/**
 * Move o job para DLQ após esgotar retries, registra métrica e log.
 * A classe precisa ter `dlq: Queue` e `queueName: string`.
 *
 * @example
 * @OnWorkerEvent("failed")
 * @RecordFailed()
 * async onFailed(_job: Job, _error: Error): Promise<void> {}
 */
export function RecordFailed(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = async function (
      this: WorkerDeps,
      job: Job,
      error: Error,
    ): Promise<void> {
      logger.error("Job failed", {
        job: job.name,
        jobId: job.id,
        queue: this.queueName,
        attempt: job.attemptsMade,
        error: error.message,
        stack: error.stack,
      });

      const labels = { queue: this.queueName, job_name: job.name };
      // TelemetryRegistry.get(QueueMetricsService).recordFailed(labels);

      if (job.attemptsMade >= (job.opts.attempts ?? 1)) {
        try {
          await this.dlq.add(
            job.name,
            {
              originalJob: sanitizeJobData(
                job.name,
                job.data as Record<string, unknown>,
              ),
              error: error.message,
              failedAt: new Date().toISOString(),
            },
            { removeOnFail: { age: 7 * 24 * 60 * 60 } },
          );

          logger.warn("Job moved to DLQ", {
            job: job.name,
            jobId: job.id,
            queue: this.queueName,
          });
        } finally {
          // TelemetryRegistry.get(QueueMetricsService).recordMovedToDlq(labels);
        }
      }

      await original.call(this, job, error);
    };

    return descriptor;
  };
}

/**
 * Registra métrica e log no evento stalled.
 * A classe precisa ter `queueName: string`.
 *
 * @example
 * @OnWorkerEvent("stalled")
 * @RecordStalled()
 * onStalled(_jobId: string): void {}
 */
export function RecordStalled(): MethodDecorator {
  return (_target, _key, descriptor: PropertyDescriptor) => {
    const original = descriptor.value;

    descriptor.value = function (this: WorkerDeps, jobId: string): void {
      logger.warn("Job stalled", { jobId, queue: this.queueName });
      // TelemetryRegistry.get(QueueMetricsService).recordStalled(this.queueName);
      original.call(this, jobId);
    };

    return descriptor;
  };
}
