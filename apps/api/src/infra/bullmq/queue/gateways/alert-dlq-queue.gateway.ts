import { DlqGateway } from "../../shared";
import { AlertJobPayload } from "../types/alert-job.types";

export abstract class AlertDlqQueueGateway extends DlqGateway<AlertJobPayload> {}
