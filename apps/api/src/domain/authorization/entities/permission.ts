import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";

type PermisionProps = {
  action: string;
  resource: string;
  description: string | null;
};

export class Permission extends Entity<PermisionProps> {
  get action() {
    return this.props.action;
  }

  get resource() {
    return this.props.resource;
  }

  get description() {
    return this.props.description;
  }

  static create(props: PermisionProps, id?: UniqueEntityID) {
    return new Permission(props, id);
  }
}
