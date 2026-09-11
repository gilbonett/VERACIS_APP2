import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/domain/common/value-objects/slug-vo";
import { Community } from "@/domain/communities/entities/community";
import { Prisma, Community as PrismaCommunity } from "@generated/client";

export class PrismaCommunityMapper {
  static toDomain(raw: PrismaCommunity): Community {
    return Community.toCreate(
      {
        name: raw.name,
        slug: Slug.create(raw.slug),
        description: raw.description,
        lat: raw.lat,
        lng: raw.lng,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        authorId: new UniqueEntityID(raw.authorId),
        biomeId: new UniqueEntityID(raw.biomeId),
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(data: Community): Prisma.CommunityUncheckedCreateInput {
    return {
      id: data.id.toValue(),
      name: data.name,
      slug: data.slug.value,
      description: data.description,
      lat: data.lat,
      lng: data.lng,
      authorId: data.authorId.toValue(),
      biomeId: data.biomeId.toValue(),
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
