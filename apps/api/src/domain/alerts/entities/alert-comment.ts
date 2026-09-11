import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type AlertCommentProps = {
  content: string;

  createdAt?: Date;
  updatedAt?: Date;

  alertId: UniqueEntityID;
  authorId: UniqueEntityID;
};

export class AlertComment extends Entity<AlertCommentProps> {
  get content() {
    return this.props.content;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get alertId() {
    return this.props.alertId;
  }

  get authorId() {
    return this.props.authorId;
  }

  static create(props: AlertCommentProps, id?: UniqueEntityID) {
    const alertComment = new AlertComment(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return alertComment;
  }
}
