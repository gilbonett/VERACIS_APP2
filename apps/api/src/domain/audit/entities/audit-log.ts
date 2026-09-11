import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type AuditLogProps = {
  scope: string;
  eventType: string;

  actorUserId: UniqueEntityID | null;

  ipAddress: string | null;
  userAgent: string | null;
  metadata: Record<string, unknown> | null;

  createdAt: Date;
};

export class AuditLog extends Entity<AuditLogProps> {
  get scope() {
    return this.props.scope;
  }

  get eventType() {
    return this.props.eventType;
  }

  get actorUserId() {
    return this.props.actorUserId;
  }

  get ipAddress() {
    return this.props.ipAddress;
  }

  get userAgent() {
    return this.props.userAgent;
  }

  get metadata() {
    return this.props.metadata;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  static create(
    props: Omit<AuditLogProps, "createdAt">,
    id?: UniqueEntityID,
  ): AuditLog {
    return new AuditLog({ ...props, createdAt: new Date() }, id);
  }
}
