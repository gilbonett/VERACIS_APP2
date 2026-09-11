import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  OtpChallenge,
  OtpChallengeState,
} from "@/domain/auth/entities/otp-challenge";
import { OtpChallenge as PrismaOtpChallenge } from "@generated/client";

export class PrismaOtpChallengeMapper {
  static toDomain(raw: PrismaOtpChallenge): OtpChallenge {
    return OtpChallenge.reconstitute(
      {
        userId: new UniqueEntityID(raw.userId),
        state: raw.state as OtpChallengeState,
        email: raw.email,
        codeHash: raw.codeHash,
        attempts: raw.attempts,
        expiresAt: raw.expiresAt,
        createdAt: raw.createdAt,
      },
      new UniqueEntityID(raw.id),
    );
  }

  static toPrisma(challenge: OtpChallenge) {
    return {
      id: challenge.id.toString(),
      userId: challenge.userId.toString(),
      state: challenge.state,
      email: challenge.email,
      codeHash: challenge.codeHash,
      attempts: challenge.attempts,
      expiresAt: challenge.expiresAt,
      createdAt: challenge.createdAt,
    };
  }
}
