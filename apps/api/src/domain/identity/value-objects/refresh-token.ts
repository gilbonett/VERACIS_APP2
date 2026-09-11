import { Either, left, right } from "@/core/either";
import { InvalidRefreshTokenError } from "../errors/invalid-refresh-token-error";

export class RefreshToken {
  private constructor(
    readonly sessionId: string,
    readonly generation: number,
    readonly secret: string,
  ) {}

  static parse(raw: string): Either<InvalidRefreshTokenError, RefreshToken> {
    if (typeof raw !== "string") {
      return left(new InvalidRefreshTokenError());
    }

    const parts = raw.split(".");
    if (parts.length !== 3) {
      return left(new InvalidRefreshTokenError());
    }

    const [sessionId, generationRaw, secret] = parts;

    if (!sessionId || !generationRaw || !secret) {
      return left(new InvalidRefreshTokenError());
    }

    if (!/^\d+$/.test(generationRaw)) {
      return left(new InvalidRefreshTokenError());
    }

    const generation = Number(generationRaw);
    if (!Number.isSafeInteger(generation)) {
      return left(new InvalidRefreshTokenError());
    }

    return right(new RefreshToken(sessionId, generation, secret));
  }
}
