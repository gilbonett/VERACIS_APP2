import {
  AuthJobOptions,
  SendOtpCodeJobPayload,
  SendPasswordResetJobPayload,
  SendWelcomeEmailJobPayload,
} from "../types/auth-job.types";

export abstract class AuthQueueGateway {
  abstract sendOtpCode(
    data: SendOtpCodeJobPayload,
    options?: AuthJobOptions,
  ): Promise<void>;
  abstract sendPasswordReset(
    data: SendPasswordResetJobPayload,
    options?: AuthJobOptions,
  ): Promise<void>;
  abstract sendWelcomeEmail(
    data: SendWelcomeEmailJobPayload,
    options?: AuthJobOptions,
  ): Promise<void>;
  abstract cancel(jobId: string): Promise<void>;
}
