import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Slug } from "@/domain/common/value-objects/slug-vo";

export type BiomeProps = {
  name: string;
  slug: Slug;
  description?: string | null;

  createdAt?: Date;
  updatedAt?: Date;
};

export class Biome extends Entity<BiomeProps> {
  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  static toCreate(props: Optional<BiomeProps, "slug">, id?: UniqueEntityID) {
    return new Biome(
      {
        ...props,
        slug: props.slug ?? Slug.createFromText(props.name),
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
