import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/domain/common/value-objects/slug-vo";
import { Event } from "@/domain/communities/entities/event";
import { Prisma, Event as PrismaEvent } from "@generated/client";

export class PrismaEventMapper {
  static toDomain(raw: PrismaEvent): Event {
    return Event.create({
      name: raw.name,
      description: raw.description,
      slug: Slug.create(raw.slug),
      icon: raw.icon,
      categoryId: new UniqueEntityID(raw.categoryId),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    });
  }

  static toPrisma(raw: Event): Prisma.EventUncheckedCreateInput {
    return {
      id: raw.id.toString(),
      name: raw.name,
      description: raw.description,
      slug: raw.slug.value,
      icon: raw.icon,
      categoryId: raw.categoryId.toString(),
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
