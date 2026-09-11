import { WatchedList } from "@/core/entities/watched-list";
import { AlertRisk } from "./alert-risk";

export class AlertRiskList extends WatchedList<AlertRisk> {
  compareItems(a: AlertRisk, b: AlertRisk): boolean {
    return a.riskId.equals(b.riskId);
  }
}
