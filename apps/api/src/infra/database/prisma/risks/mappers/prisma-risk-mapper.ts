import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/core/value-objects/slug";
import { Risk } from "@/domain/risks/entities/risk";
import { Prisma, Risk as PrismaRisk } from "@generated/client";

export class PrismaRiskMapper {
  static toDomain(raw: PrismaRisk): Risk {
    return Risk.create(
      {
        name: raw.name,
        slug: Slug.create(raw.slug),
        description: raw.description,
        url: raw.url,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(data: Risk): Prisma.RiskUncheckedCreateInput {
    return {
      id: data.id.toString(),
      name: data.name,
      slug: data.slug.value,
      description: data.description,
      url: data.url,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
