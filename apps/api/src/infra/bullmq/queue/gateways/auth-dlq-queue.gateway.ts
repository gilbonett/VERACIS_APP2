import { DlqGateway } from "../../shared";
import { AuthJobPayload } from "../types/auth-job.types";

export abstract class AuthDlqQueueGateway extends DlqGateway<AuthJobPayload> {}
