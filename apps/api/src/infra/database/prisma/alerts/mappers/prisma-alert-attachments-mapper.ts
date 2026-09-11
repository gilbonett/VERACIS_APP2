import { AlertAttachment } from "@/domain/alerts/entities/alert-attachment";
import { Prisma } from "@generated/client";

export class PrismaAlertAttachmentsMapper {
  static toPrisma(
    attachments: AlertAttachment[],
  ): Prisma.AttachmentUpdateManyArgs {
    const attachmentIds = attachments.map((attachment) => {
      return attachment.attachmentId.toString();
    });

    return {
      where: {
        id: {
          in: attachmentIds,
        },
      },
      data: {
        alertId: attachments[0].alertId.toString(),
      },
    };
  }
}
