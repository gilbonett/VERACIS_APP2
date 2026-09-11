import { AlertStatus } from "@/domain/alerts/entities/alert";

export interface AlertJobPayload {
  alertId: string;
  authorId: string;
  communityId: string;
  status: AlertStatus;
  categoryId: string;
}

export interface AlertJobOptions {
  jobId?: string;
  delay?: number;
}
