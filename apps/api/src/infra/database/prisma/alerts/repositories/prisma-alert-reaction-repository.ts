import { AlertReaction } from "@/domain/alerts/entities/alert-reaction";
import { AlertReactionRepository } from "@/domain/alerts/repositories/alert-reaction-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertReactionMapper } from "../mappers/prisma-alert-reaction-mapper";

@Injectable()
export class PrismaAlertReactionRepository implements AlertReactionRepository {
  constructor(private prisma: PrismaService) {}

  async findCountByAlertIdAndLiked(alertId: string): Promise<number> {
    return this.prisma.alertReaction.count({
      where: {
        alertId,
        type: "LIKE",
      },
    });
  }

  async findByAlertIdAndAuthorId(
    alertId: string,
    authorId: string,
  ): Promise<AlertReaction | null> {
    const raw = await this.prisma.alertReaction.findFirst({
      where: {
        alertId,
        authorId,
      },
    });

    if (!raw) return null;

    return PrismaAlertReactionMapper.toDomain(raw);
  }

  async create(reaction: AlertReaction): Promise<void> {
    const data = PrismaAlertReactionMapper.toPrisma(reaction);
    await this.prisma.alertReaction.create({ data });
  }

  async findById(id: string): Promise<AlertReaction | null> {
    const raw = await this.prisma.alertReaction.findUnique({
      where: {
        id,
      },
    });

    if (!raw) return null;

    return PrismaAlertReactionMapper.toDomain(raw);
  }

  async findAll(): Promise<AlertReaction[]> {
    const raw = await this.prisma.alertReaction.findMany();
    return raw.map(PrismaAlertReactionMapper.toDomain);
  }

  async save(reaction: AlertReaction): Promise<void> {
    const data = PrismaAlertReactionMapper.toPrisma(reaction);
    await this.prisma.alertReaction.update({
      where: { id: reaction.id.toString() },
      data,
    });
  }

  async delete(reaction: AlertReaction): Promise<void> {
    await this.prisma.alertReaction.delete({
      where: { id: reaction.id.toString() },
    });
  }
}
