import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { DlqPayload } from "../../shared";
import { AuthDlqQueueGateway, AuthQueueGateway } from "../gateways";
import { JOB_NAMES, QUEUE_NAMES } from "../queue.constants";
import { AuthDlqEntry, AuthJobPayload } from "../types/auth-job.types";

@Injectable()
export class AuthDlqProducer implements AuthDlqQueueGateway {
  constructor(
    @InjectQueue(QUEUE_NAMES.AUTH_DLQ) private readonly dlq: Queue,
    private readonly authQueueGateway: AuthQueueGateway,
  ) {}

  async send(payload: DlqPayload<AuthJobPayload>): Promise<void> {
    await this.dlq.add(payload.originalJobName, payload, {
      removeOnComplete: true,
    });
  }

  async retry(jobId: string): Promise<void> {
    const job = await this.dlq.getJob(jobId);

    if (job) {
      const dlqEntry = job.data as DlqPayload<AuthJobPayload> & AuthDlqEntry;

      switch (dlqEntry.originalJobName) {
        case JOB_NAMES.SEND_OTP_CODE:
          await this.authQueueGateway.sendOtpCode(dlqEntry.data);
          break;
        case JOB_NAMES.SEND_WELCOME:
          await this.authQueueGateway.sendWelcomeEmail(dlqEntry.data);
          break;
        case JOB_NAMES.SEND_PASSWORD_RESET:
          await this.authQueueGateway.sendPasswordReset(dlqEntry.data);
          break;
        default:
          await job.remove();
      }
    }
  }

  async discard(jobId: string): Promise<void> {
    const job = await this.dlq.getJob(jobId);

    if (job) await job.remove();
  }
}
