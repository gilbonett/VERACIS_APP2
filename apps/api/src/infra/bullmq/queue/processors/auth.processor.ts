import { OnWorkerEvent, Processor } from "@nestjs/bullmq";
import { Inject } from "@nestjs/common";
import { Job } from "bullmq";
import { BaseQueueProcessor, JobHandler } from "../../shared";
import { AuthDlqQueueGateway } from "../gateways";
import { AUTH_JOB_HANDLERS } from "../handlers";
import { QUEUE_NAMES } from "../queue.constants";

@Processor(QUEUE_NAMES.AUTH)
export class AuthProcessor extends BaseQueueProcessor {
  constructor(
    @Inject(AUTH_JOB_HANDLERS) handlers: JobHandler[],
    private readonly authDlqQueueGateway: AuthDlqQueueGateway,
  ) {
    super(handlers);
  }

  @OnWorkerEvent("failed")
  async onFailed(job: Job, error: Error): Promise<void> {
    await this.sendToDlq(this.authDlqQueueGateway, job, error);
  }
}
