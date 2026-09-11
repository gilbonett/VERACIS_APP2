import { AlertJobOptions, AlertJobPayload } from "../types/alert-job.types";

export abstract class AlertQueueGateway {
  abstract schedulePending(
    data: AlertJobPayload,
    options?: AlertJobOptions,
  ): Promise<void>;
  abstract scheduleAccepted(
    data: AlertJobPayload,
    options?: AlertJobOptions,
  ): Promise<void>;
  abstract cancel(jobId: string): Promise<void>;
}
