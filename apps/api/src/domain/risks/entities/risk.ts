import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Slug } from "@/core/value-objects/slug";

type RiskProps = {
  name: string;
  slug: Slug;
  description?: string | null;
  url?: string | null;
  createdAt: Date;
  updatedAt?: Date;
};

export class Risk extends Entity<RiskProps> {
  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get url() {
    return this.props.url;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static create(
    props: Optional<RiskProps, "createdAt" | "slug">,
    id?: UniqueEntityID,
  ) {
    return new Risk(
      {
        ...props,
        slug: props.slug ?? Slug.create(props.name),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
