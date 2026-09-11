import { OnWorkerEvent, Processor } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { BaseQueueProcessor, JobHandler } from "../../shared";
import { AlertDlqQueueGateway } from "../gateways";
import { ALERT_JOB_HANDLERS } from "../handlers";
import { QUEUE_NAMES } from "../queue.constants";

@Processor(QUEUE_NAMES.ALERT)
export class AlertProcessor extends BaseQueueProcessor {
  constructor(
    @Inject(ALERT_JOB_HANDLERS) handlers: JobHandler[],
    private readonly alertDlqQueueGateway: AlertDlqQueueGateway,
  ) {
    super(handlers);
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job, error: Error): Promise<void> {
    await this.sendToDlq(this.alertDlqQueueGateway, job, error);
  }
}
