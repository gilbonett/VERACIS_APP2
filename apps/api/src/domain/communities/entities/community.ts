import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/domain/common/value-objects/slug-vo";

type CommunityProps = {
  name: string;
  slug: Slug;
  description?: string | null;
  lat: number;
  lng: number;

  createdAt?: Date;
  updatedAt?: Date;

  biomeId: UniqueEntityID;
  authorId: UniqueEntityID;
};

export class Community extends Entity<CommunityProps> {
  get name() {
    return this.props.name;
  }

  get slug() {
    return this.props.slug;
  }

  get description() {
    return this.props.description;
  }

  get lat() {
    return this.props.lat;
  }

  get lng() {
    return this.props.lng;
  }

  get createdAt() {
    return this.props.createdAt;
  }

  get updatedAt() {
    return this.props.updatedAt;
  }

  get biomeId() {
    return this.props.biomeId;
  }

  get authorId() {
    return this.props.authorId;
  }

  static toCreate(props: CommunityProps, id?: UniqueEntityID) {
    return new Community(
      {
        ...props,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? new Date(),
      },
      id,
    );
  }
}
