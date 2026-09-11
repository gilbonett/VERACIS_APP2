import { Transaction } from "@/core/repositories/transaction";
import { AlertAttachment } from "@/domain/alerts/entities/alert-attachment";
import { AlertAttachmentsRepository } from "@/domain/alerts/repositories/alert-attachments-repository";
import { TransactionClient } from "@generated/internal/prismaNamespace";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertAttachmentsMapper } from "../mappers/prisma-alert-attachments-mapper";

@Injectable()
export class PrismaAlertAttachmentsRepository implements AlertAttachmentsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createMany(
    attachments: AlertAttachment[],
    tx?: Transaction,
  ): Promise<void> {
    if (attachments.length === 0) {
      return;
    }

    const client = (tx as TransactionClient) ?? this.prisma;

    const data = PrismaAlertAttachmentsMapper.toPrisma(attachments);

    await client.attachment.updateMany(data);
  }

  async deleteMany(
    attachments: AlertAttachment[],
    tx?: Transaction,
  ): Promise<void> {
    if (attachments.length === 0) {
      return;
    }

    const client = (tx as TransactionClient) ?? this.prisma;

    const attachmentIds = attachments.map((attachment) => {
      return attachment.id.toString();
    });

    await client.attachment.deleteMany({
      where: {
        id: {
          in: attachmentIds,
        },
      },
    });
  }
}
