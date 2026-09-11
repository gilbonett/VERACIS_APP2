import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Category } from "@/domain/categories/entities/category";
import { Prisma, Category as PrismaCategory } from "@generated/client";

export class PrismaCategoryMapper {
  static toDomain(raw: PrismaCategory): Category {
    return Category.create(
      {
        name: raw.name,
        description: raw.description,
        icon: raw.icon,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(props: Category): Prisma.CategoryUncheckedCreateInput {
    return {
      id: props.id.toString(),
      name: props.name,
      description: props.description,
      icon: props.icon,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    };
  }
}
