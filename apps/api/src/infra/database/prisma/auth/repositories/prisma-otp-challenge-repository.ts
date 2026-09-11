import { OtpChallenge } from "@/domain/auth/entities/otp-challenge";
import { OtpChallengeRepository } from "@/domain/auth/repositories/otp-challenge-repository";
import { Injectable } from "@nestjs/common";
import { OutboxRepository } from "../../outbox/outbox-repository";
import { PrismaService } from "../../prisma.service";
import { PrismaOtpChallengeMapper } from "../mappers/prisma-otp-challenge-mapper";

@Injectable()
export class PrismaOtpChallengeRepository implements OtpChallengeRepository {
  constructor(
    private prisma: PrismaService,
    private outboxRepository: OutboxRepository,
  ) {}

  async create(challenge: OtpChallenge): Promise<void> {
    const data = PrismaOtpChallengeMapper.toPrisma(challenge);

    await this.prisma.$transaction(async (tx) => {
      await tx.otpChallenge.create({ data });
      await this.outboxRepository.create(challenge, tx);
    });

    challenge.clearEvents();
  }

  async findAll(): Promise<OtpChallenge[]> {
    const challenges = await this.prisma.otpChallenge.findMany();
    return challenges.map(PrismaOtpChallengeMapper.toDomain);
  }

  async save(challenge: OtpChallenge): Promise<void> {
    const data = PrismaOtpChallengeMapper.toPrisma(challenge);

    await this.prisma.$transaction(async (tx) => {
      await tx.otpChallenge.update({
        where: { id: data.id },
        data: {
          state: data.state,
          email: data.email,
          codeHash: data.codeHash,
          attempts: data.attempts,
        },
      });
      await this.outboxRepository.create(challenge, tx);
    });

    challenge.clearEvents();
  }

  async delete(challenge: OtpChallenge): Promise<void> {
    await this.prisma.$transaction(async (tx) => {
      await tx.otpChallenge.delete({
        where: { id: challenge.id.toString() },
      });
      await this.outboxRepository.create(challenge, tx);
    });

    challenge.clearEvents();
  }

  async findById(id: string): Promise<OtpChallenge | null> {
    const raw = await this.prisma.otpChallenge.findUnique({ where: { id } });

    if (!raw) return null;
    return PrismaOtpChallengeMapper.toDomain(raw);
  }

  async expirePendingByUserId(userId: string): Promise<void> {
    await this.prisma.otpChallenge.updateMany({
      where: { userId, state: { in: ["PENDING_EMAIL", "PENDING_CODE"] } },
      data: { state: "EXPIRED" },
    });
  }
}
