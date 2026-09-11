import { AlertComment } from "@/domain/alerts/entities/alert-comment";
import { AlertCommentRepository } from "@/domain/alerts/repositories/alert-comment-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaAlertCommentMapper } from "../mappers/prisma-alert-comment-mapper";

@Injectable()
export class PrismaAlertCommentRepository implements AlertCommentRepository {
  constructor(private prisma: PrismaService) {}

  async create(comment: AlertComment): Promise<void> {
    const data = PrismaAlertCommentMapper.toPrisma(comment);

    await this.prisma.alertComment.create({
      data,
    });
  }

  async findById(id: string): Promise<AlertComment | null> {
    const comment = await this.prisma.alertComment.findUnique({
      where: { id },
    });

    if (!comment) return null;

    return PrismaAlertCommentMapper.toDomain(comment);
  }

  async findAll(): Promise<AlertComment[]> {
    const comments = await this.prisma.alertComment.findMany();

    return comments.map(PrismaAlertCommentMapper.toDomain);
  }

  async save(comment: AlertComment): Promise<void> {
    const data = PrismaAlertCommentMapper.toPrisma(comment);

    await this.prisma.alertComment.update({
      where: { id: comment.id.toString() },
      data,
    });
  }

  async delete(comment: AlertComment): Promise<void> {
    await this.prisma.alertComment.delete({
      where: { id: comment.id.toString() },
    });
  }
}
