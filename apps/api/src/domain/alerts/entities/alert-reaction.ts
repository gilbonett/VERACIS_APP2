import { AggregateRoot } from "@/core/entities/aggregate-root";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserRole } from "@/domain/users/entities/user";

type AlertReactionType = "LIKE" | "DISLIKE";

export type AlertReactionProps = {
  type: AlertReactionType;

  createdAt?: Date;
  updatedAt?: Date;

  alertId: UniqueEntityID;
  authorId: UniqueEntityID;
};

interface CreateAlertReactionProps {
  type: AlertReactionType;
  alertId: UniqueEntityID;
  authorId: UniqueEntityID;
  communityId: UniqueEntityID;
  currentUserRole: UserRole;
}

export class AlertReaction extends AggregateRoot<AlertReactionProps> {
  get type() {
    return this.props.type;
  }

  get authorId() {
    return this.props.authorId;
  }

  get alertId() {
    return this.props.alertId;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(data: CreateAlertReactionProps) {
    const now = new Date();
    const reaction = new AlertReaction({
      type: data.type,
      alertId: data.alertId,
      authorId: data.authorId,
      createdAt: now,
      updatedAt: now,
    });

    return reaction;
  }

  static reconstitute(props: AlertReactionProps, id?: UniqueEntityID) {
    return new AlertReaction(props, id);
  }
}
