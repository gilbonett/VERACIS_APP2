import { PasswordReset } from "@/domain/auth/entities/password-reset";
import { PasswordResetRepository } from "@/domain/auth/repositories/password-reset-repository";

import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaPasswordResetMapper } from "../mappers/prisma-password-reset-mapper";

@Injectable()
export class PrismaPasswordResetsRepository implements PasswordResetRepository {
  constructor(
    private readonly prisma: PrismaService,
    private readonly outboxRepository: OutboxRepository,
  ) {}

  async create(reset: PasswordReset): Promise<void> {
    const data = PrismaPasswordResetMapper.toPrisma(reset);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.create({ data });
      await this.outboxRepository.create(reset, tx);
    });

    reset.clearEvents();
  }

  async findAll(): Promise<PasswordReset[]> {
    const raw = await this.prisma.passwordReset.findMany();
    return raw.map(PrismaPasswordResetMapper.toDomain);
  }

  async save(reset: PasswordReset): Promise<void> {
    const data = PrismaPasswordResetMapper.toPrisma(reset);

    await this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.update({
        where: { id: reset.id.toString() },
        data: { usedAt: data.usedAt, expiresAt: data.expiresAt },
      });
      await this.outboxRepository.create(reset, tx);
    });

    reset.clearEvents();
  }

  async delete(reset: PasswordReset): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.passwordReset.delete({
        where: { id: reset.id.toString() },
      });
      await this.outboxRepository.create(reset, tx);
    });

    reset.clearEvents();
  }

  async findById(id: string): Promise<PasswordReset | null> {
    const raw = await this.prisma.passwordReset.findUnique({ where: { id } });

    if (!raw) return null;

    return PrismaPasswordResetMapper.toDomain(raw);
  }

  async expirePendingByUserId(userId: string): Promise<void> {
    await this.prisma.passwordReset.updateMany({
      where: { userId, usedAt: null, expiresAt: { gt: new Date() } },
      data: { expiresAt: new Date() },
    });
  }
}
