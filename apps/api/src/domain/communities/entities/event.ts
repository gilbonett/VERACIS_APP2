import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/domain/common/value-objects/slug-vo";

type EventProps = {
  name: string;
  slug: Slug;
  description?: string | null;

  icon?: string | null;

  createdAt?: Date;
  updatedAt?: Date;

  categoryId: UniqueEntityID;
};

export class Event extends Entity<EventProps> {
  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get icon() {
    return this.props.icon;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get categoryId() {
    return this.props.categoryId;
  }

  static create(props: EventProps, id?: UniqueEntityID) {
    const event = new Event(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );

    return event;
  }
}
