import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Alert } from "@/domain/alerts/entities/alert";
import { Prisma, Alert as PrismaAlert } from "@generated/client";

export class PrismaAlertMapper {
  static toDomain(raw: PrismaAlert): Alert {
    return Alert.reconstitute(
      {
        status: raw.status,
        description: raw.description,
        lat: raw.lat,
        lng: raw.lng,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
        categoryId: new UniqueEntityID(raw.categoryId),
        authorId: new UniqueEntityID(raw.authorId),
        communityId: new UniqueEntityID(raw.communityId),
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(raw: Alert): Prisma.AlertUncheckedCreateInput {
    return {
      id: raw.id.toValue(),
      status: raw.status,
      description: raw.description,
      lat: raw.lat,
      lng: raw.lng,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
      categoryId: raw.categoryId.toValue(),
      authorId: raw.authorId.toValue(),
      communityId: raw.communityId.toValue(),
    };
  }
}
