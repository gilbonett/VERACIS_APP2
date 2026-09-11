import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Biome } from "@/domain/common/entities/biome";
import { Slug } from "@/domain/common/value-objects/slug-vo";
import { Prisma, Biome as PrismaBiome } from "@generated/client";

export class PrismaBiomeMapper {
  static toDomain(raw: PrismaBiome): Biome {
    return Biome.toCreate(
      {
        name: raw.name,
        slug: Slug.create(raw.slug),
        description: raw.description,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(data: Biome): Prisma.BiomeUncheckedCreateInput {
    return {
      id: data.id.toValue(),
      name: data.name,
      slug: data.slug.value,
      description: data.description,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
