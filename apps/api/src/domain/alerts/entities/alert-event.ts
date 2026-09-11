import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type AlertEventProps = {
  alertId: UniqueEntityID;
  eventId: UniqueEntityID;
};

export class AlertEvent extends Entity<AlertEventProps> {
  get alertId() {
    return this.props.alertId;
  }

  get eventId() {
    return this.props.eventId;
  }

  static create(props: AlertEventProps, id?: UniqueEntityID) {
    return new AlertEvent(props, id);
  }
}
