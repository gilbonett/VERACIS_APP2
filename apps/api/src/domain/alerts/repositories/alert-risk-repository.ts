import { Transaction } from "@/core/repositories/transaction";
import { AlertRisk } from "../entities/alert-risk";

export abstract class AlertRiskRepository {
  abstract createMany(risks: AlertRisk[], tx?: Transaction): Promise<void>;
  abstract deleteMany(risks: AlertRisk[], tx?: Transaction): Promise<void>;
}
