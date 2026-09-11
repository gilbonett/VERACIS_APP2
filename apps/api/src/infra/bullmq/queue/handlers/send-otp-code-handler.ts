import { MailRepository } from "@/infra/mail/mail-repository";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobHandler } from "../../shared";
import { JOB_NAMES } from "../queue.constants";
import { SendOtpCodeJobPayload } from "../types/auth-job.types";

@Injectable()
export class SendOtpCodeHandler implements JobHandler<SendOtpCodeJobPayload> {
  readonly jobName = JOB_NAMES.SEND_OTP_CODE;

  constructor(private readonly mailer: MailRepository) {}

  async handle(job: Job<SendOtpCodeJobPayload>): Promise<void> {
    await this.mailer.sendOtpCode(job.data.to, job.data.name, job.data.code);
  }
}
