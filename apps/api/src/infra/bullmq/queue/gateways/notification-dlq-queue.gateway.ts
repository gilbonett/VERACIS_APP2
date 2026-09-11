import { DlqGateway } from "../../shared";
import { NotificationByAlertJobPayload } from "../types/notification-job.types";

export abstract class NotificationDlqQueueGateway extends DlqGateway<NotificationByAlertJobPayload> {}
