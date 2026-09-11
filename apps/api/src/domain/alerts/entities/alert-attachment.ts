import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type AlertAttachmentProps = {
  alertId: UniqueEntityID;
  attachmentId: UniqueEntityID;
};

export class AlertAttachment extends Entity<AlertAttachmentProps> {
  get alertId() {
    return this.props.alertId;
  }

  get attachmentId() {
    return this.props.attachmentId;
  }

  static create(props: AlertAttachmentProps) {
    return new AlertAttachment(props);
  }
}
