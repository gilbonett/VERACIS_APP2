import { Repository } from "@/core/repositories/repository";
import { Alert, AlertStatus } from "../entities/alert";

export abstract class AlertRepository extends Repository<Alert> {
  abstract updateStatus(alertId: string, status: AlertStatus): Promise<void>;
}
