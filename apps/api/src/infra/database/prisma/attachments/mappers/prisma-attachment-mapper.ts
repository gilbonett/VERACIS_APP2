import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Attachment } from "@/domain/attachments/entities/attachment";
import { Prisma, Attachment as PrismaAttachment } from "@generated/client";

export class PrismaAttachmentMapper {
  static toDomain(raw: PrismaAttachment): Attachment {
    return Attachment.reconstitute(
      {
        fileName: raw.fileName,
        fileSize: raw.fileSize,
        fileType: raw.fileType,
        path: raw.path,
        scope: raw.scope,
        url: raw.url,
        createdAt: raw.createdAt,
        updatedAt: raw.updatedAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(data: Attachment): Prisma.AttachmentUncheckedCreateInput {
    return {
      id: data.id.toString(),
      fileName: data.fileName,
      fileSize: data.fileSize,
      fileType: data.fileType,
      path: data.path,
      scope: data.scope,
      url: data.url,
      createdAt: data.createdAt,
      updatedAt: data.updatedAt,
    };
  }
}
