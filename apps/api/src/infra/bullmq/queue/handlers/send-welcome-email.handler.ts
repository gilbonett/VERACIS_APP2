import { MailRepository } from "@/infra/mail/mail-repository";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobHandler } from "../../shared";
import { JOB_NAMES } from "../queue.constants";
import { SendWelcomeEmailJobPayload } from "../types/auth-job.types";

@Injectable()
export class SendWelcomeEmailHandler implements JobHandler<SendWelcomeEmailJobPayload> {
  readonly jobName = JOB_NAMES.SEND_WELCOME;

  constructor(private readonly mailer: MailRepository) {}

  async handle(job: Job<SendWelcomeEmailJobPayload>): Promise<void> {
    await this.mailer.sendWelcome(job.data.to, job.data.name);
  }
}
