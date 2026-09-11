import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type AlertRiskProps = {
  alertId: UniqueEntityID;
  riskId: UniqueEntityID;
};

export class AlertRisk extends Entity<AlertRiskProps> {
  get alertId() {
    return this.props.alertId;
  }

  get riskId() {
    return this.props.riskId;
  }

  static create(props: AlertRiskProps) {
    return new AlertRisk(props);
  }
}
