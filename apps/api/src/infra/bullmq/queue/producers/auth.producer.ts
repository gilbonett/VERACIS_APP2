import { InjectQueue } from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { Queue } from "bullmq";
import { AuthQueueGateway } from "../gateways";
import { JOB_NAMES, QUEUE_NAMES } from "../queue.constants";
import {
  AuthJobOptions,
  SendOtpCodeJobPayload,
  SendPasswordResetJobPayload,
  SendWelcomeEmailJobPayload,
} from "../types/auth-job.types";

@Injectable()
export class AuthProducer implements AuthQueueGateway {
  constructor(@InjectQueue(QUEUE_NAMES.AUTH) private readonly queue: Queue) {}

  async sendWelcomeEmail(
    data: SendWelcomeEmailJobPayload,
    options?: AuthJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.SEND_WELCOME, data, {
      ...options,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    });
  }

  async sendOtpCode(
    data: SendOtpCodeJobPayload,
    options?: AuthJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.SEND_OTP_CODE, data, {
      ...options,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    });
  }

  async sendPasswordReset(
    data: SendPasswordResetJobPayload,
    options?: AuthJobOptions,
  ): Promise<void> {
    await this.queue.add(JOB_NAMES.SEND_PASSWORD_RESET, data, {
      ...options,
      removeOnComplete: true,
      removeOnFail: { count: 50 },
    });
  }

  async cancel(jobId: string): Promise<void> {
    const job = await this.queue.getJob(jobId);

    if (job && !(await job.isActive())) {
      await job.remove();
    }
  }
}
