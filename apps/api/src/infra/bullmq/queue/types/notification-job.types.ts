export interface NotificationByAlertJobPayload {
  alertId: string;
  authorId: string;
  communityId: string;
  categoryId: string;
}

export interface NotificationByUserJobPayload {
  userId: string;
  name: string;
  communityIds: string[];
}

export interface NotificationJobOptions {
  jobId?: string;
}
