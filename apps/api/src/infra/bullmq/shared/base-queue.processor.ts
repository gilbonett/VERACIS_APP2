import { WorkerHost } from "@nestjs/bullmq";
import { Job, UnrecoverableError } from "bullmq";
import { DlqGateway } from "./dlq-gateway.contract";
import { JobHandler } from "./job-handler.contract";

/**
 * Processor base: roteia cada job para o handler correto via job.name,
 * sem precisar de switch/case. Toda queue nova reaproveita isso, só
 * fornecendo a lista de handlers (via DI) e implementando @Processor()/
 * @OnWorkerEvent() na subclasse concreta.
 */
export abstract class BaseQueueProcessor extends WorkerHost {
  private readonly handlerMap: Map<string, JobHandler>;

  protected constructor(handlers: JobHandler[]) {
    super();
    this.handlerMap = new Map(
      handlers.map((handler) => [handler.jobName, handler]),
    );
  }

  async process(job: Job): Promise<void> {
    const handler = this.handlerMap.get(job.name);

    if (!handler) {
      throw new UnrecoverableError(`Unknown job: ${job.name}`);
    }

    await handler.handle(job);
  }

  /**
   * Chame isto de dentro do @OnWorkerEvent('failed') de cada processor
   * concreto, passando o gateway de DLQ daquele domínio.
   */
  protected async sendToDlq(
    dlqGateway: DlqGateway,
    job: Job,
    error: Error,
  ): Promise<void> {
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      await dlqGateway.send({
        originalJobName: job.name,
        failedReason: error.message,
        attemptsMade: job.attemptsMade,
        data: job.data,
      });
    }
  }
}
