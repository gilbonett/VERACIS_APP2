import { MailRepository } from "@/infra/mail/mail-repository";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobHandler } from "../../shared";
import { JOB_NAMES } from "../queue.constants";
import { SendPasswordResetJobPayload } from "../types/auth-job.types";

@Injectable()
export class SendPasswordResetJobPayloadHandler implements JobHandler<SendPasswordResetJobPayload> {
  readonly jobName = JOB_NAMES.SEND_PASSWORD_RESET;

  constructor(private readonly mailer: MailRepository) {}

  async handle(job: Job<SendPasswordResetJobPayload>): Promise<void> {
    await this.mailer.sendPasswordReset(
      job.data.to,
      job.data.name,
      job.data.token,
      job.data.emailMasked,
    );
  }
}
