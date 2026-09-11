import { Attachment } from "@/domain/attachments/entities/attachment";
import { AttachmentRepository } from "@/domain/attachments/repositories/attachment-repository";
import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaAttachmentMapper } from "../mappers/prisma-attachment-mapper";

@Injectable()
export class PrismaAttachmentRepository implements AttachmentRepository {
  constructor(
    private prisma: PrismaService,
    private outboxRepository: OutboxRepository,
  ) {}

  async create(attachment: Attachment): Promise<void> {
    const data = PrismaAttachmentMapper.toPrisma(attachment);

    await this.prisma.attachment.create({ data });
  }

  async findById(id: string): Promise<Attachment | null> {
    const attachment = await this.prisma.attachment.findUnique({
      where: { id },
    });

    if (!attachment) return null;

    return PrismaAttachmentMapper.toDomain(attachment);
  }

  async findAll(): Promise<Attachment[]> {
    const attachments = await this.prisma.attachment.findMany();

    return attachments.map(PrismaAttachmentMapper.toDomain);
  }

  async save(attachment: Attachment): Promise<void> {
    const data = PrismaAttachmentMapper.toPrisma(attachment);

    await this.prisma.attachment.update({
      where: { id: attachment.id.toString() },
      data,
    });
  }

  async delete(attachment: Attachment): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.attachment.delete({
        where: { id: attachment.id.toString() },
      });

      await this.outboxRepository.create(attachment, tx);
    });

    attachment.clearEvents();
  }
}
