import { Session } from "@/domain/auth/entities/session";
import { SessionRepository } from "@/domain/auth/repositories/session-repository";
import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaSessionMapper } from "../mappers/prisma-session-mapper";

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(
    private prisma: PrismaService,
    private outboxRepository: OutboxRepository,
  ) {}

  async create(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrisma(session);

    await this.prisma.$transaction(async (tx) => {
      await tx.session.create({ data });
      await this.outboxRepository.create(session, tx);
    });

    session.clearEvents();
  }

  async findAll(): Promise<Session[]> {
    const raw = await this.prisma.session.findMany();
    return raw.map(PrismaSessionMapper.toDomain);
  }

  async save(session: Session): Promise<void> {
    const data = PrismaSessionMapper.toPrisma(session);

    await this.prisma.$transaction(async (tx) => {
      await tx.session.update({
        where: { id: data.id },
        data: { expiresAt: data.expiresAt, updatedAt: data.updatedAt },
      });
      await this.outboxRepository.create(session, tx);
    });

    session.clearEvents();
  }

  async delete(session: Session): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.session.delete({
        where: { id: session.id.toString() },
      });
      await this.outboxRepository.create(session, tx);
    });

    session.clearEvents();
  }

  async findById(id: string): Promise<Session | null> {
    const session = await this.prisma.session.findUnique({ where: { id } });

    if (!session) return null;

    return PrismaSessionMapper.toDomain(session);
  }

  async deleteAllByUserId(userId: string): Promise<void> {
    await this.prisma.session.deleteMany({ where: { userId } });
  }
}
