import { JOB_NAMES } from "../queue.constants";

export interface SendOtpCodeJobPayload {
  to: string;
  name: string;
  code: string;
}

export interface SendPasswordResetJobPayload {
  to: string;
  name: string;
  token: string;
  emailMasked: string;
}

export interface SendWelcomeEmailJobPayload {
  to: string;
  name: string;
}

export interface AuthJobOptions {
  jobId?: string;
}

export type AuthJobPayload =
  | SendOtpCodeJobPayload
  | SendWelcomeEmailJobPayload
  | SendPasswordResetJobPayload;

export type AuthDlqEntry =
  | {
      originalJobName: typeof JOB_NAMES.SEND_OTP_CODE;
      data: SendOtpCodeJobPayload;
    }
  | {
      originalJobName: typeof JOB_NAMES.SEND_WELCOME;
      data: SendWelcomeEmailJobPayload;
    }
  | {
      originalJobName: typeof JOB_NAMES.SEND_PASSWORD_RESET;
      data: SendPasswordResetJobPayload;
    };
