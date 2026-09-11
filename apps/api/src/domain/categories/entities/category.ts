import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type CategoryProps = {
  name: string;
  description?: string | null;
  icon?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
};

export class Category extends Entity<CategoryProps> {
  get name() {
    return this.props.name;
  }

  get description() {
    return this.props.description;
  }

  set description(value: string | null | undefined) {
    this.props.description = value;
    this.touch();
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

  private touch() {
    this.props.updatedAt = new Date();
  }

  static create(props: CategoryProps, id?: UniqueEntityID) {
    return new Category(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
