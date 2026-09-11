import { RateLimiterStore } from "@/application/stores/rate-limiter-store";
import { RefreshLockStore } from "@/application/stores/refresh-lock-store";
import { Either, left, right } from "@/core/either";
import { UserRoleAssignmentRepository } from "@/domain/authorization/repositories/user-role-assignment-repository";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { TokenSigner } from "@/domain/cryptography/token-signer";
import { SessionToken } from "@/domain/identity/entities/session-token";
import { ConcurrentRefreshError } from "@/domain/identity/errors/concurrent-refresh-error";
import { InvalidRefreshTokenError } from "@/domain/identity/errors/invalid-refresh-token-error";
import { TokenReuseDetectedError } from "@/domain/identity/errors/token-reuse-detected-error";
import { TooManyRefreshAttemptsError } from "@/domain/identity/errors/too-many-refresh-attempts-error";
import { SessionRepository } from "@/domain/identity/repositories/session-repository";
import { SessionTokenRepository } from "@/domain/identity/repositories/session-token-repository";
import { resolveRoleClaims } from "@/domain/identity/services/resolve-role-claims";
import { Injectable } from "@nestjs/common";

const REFRESH_RATE_LIMIT = 20;
const REFRESH_RATE_WINDOW_SECONDS = 5 * 60;
const REFRESH_LOCK_TTL_MS = 5_000;

interface RefreshSessionUseCaseRequest {
  refreshToken: string;
  ipAddress: string;
}

type RefreshSessionUseCaseResponse = Either<
  | InvalidRefreshTokenError
  | TokenReuseDetectedError
  | ConcurrentRefreshError
  | TooManyRefreshAttemptsError,
  { accessToken: string; refreshToken: string }
>;

@Injectable()
export class RefreshSessionUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private sessionTokenRepository: SessionTokenRepository,
    private userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private tokenOpaque: TokenOpaque,
    private tokenSigner: TokenSigner,
    private rateLimiter: RateLimiterStore,
    private refreshLockStore: RefreshLockStore,
  ) {}

  async execute(
    request: RefreshSessionUseCaseRequest,
  ): Promise<RefreshSessionUseCaseResponse> {
    const allowed = await this.rateLimiter.consume(
      `refresh:ip:${request.ipAddress}`,
      REFRESH_RATE_LIMIT,
      REFRESH_RATE_WINDOW_SECONDS,
    );

    if (!allowed) {
      return left(new TooManyRefreshAttemptsError());
    }

    const refreshToken = this.tokenOpaque.generate(request.refreshToken);

    const presentedToken = await this.sessionTokenRepository.findByTokenHash(
      refreshToken.hashed,
    );

    if (!presentedToken) {
      return left(new InvalidRefreshTokenError());
    }

    const initialSession = await this.sessionRepository.findById(
      presentedToken.sessionId.toString(),
    );

    if (!initialSession || !initialSession.isActive) {
      return left(new InvalidRefreshTokenError());
    }

    const lockToken = await this.refreshLockStore.acquire(
      initialSession.id.toString(),
      REFRESH_LOCK_TTL_MS,
    );

    if (!lockToken) {
      return left(new ConcurrentRefreshError());
    }

    try {
      const freshToken = await this.sessionTokenRepository.findByTokenHash(
        refreshToken.hashed,
      );

      if (!freshToken) {
        return left(new InvalidRefreshTokenError());
      }

      const session = await this.sessionRepository.findById(
        initialSession.id.toString(),
      );

      if (!session || !session.isActive) {
        return left(new InvalidRefreshTokenError());
      }

      if (freshToken.isConsumed) {
        session.revoke(new Date(), "TOKEN_REUSE");
        await this.sessionRepository.save(session);
        await this.sessionTokenRepository.revokeAllBySessionId(
          session.id.toString(),
        );
        return left(new TokenReuseDetectedError());
      }

      const roleClaims = await resolveRoleClaims(
        this.userRoleAssignmentRepository,
        session.userId.toString(),
      );

      const nextRefreshToken = this.tokenOpaque.generate();

      const nextToken = SessionToken.create({
        version: freshToken.version + 1,
        tokenHash: nextRefreshToken.hashed,
        sessionId: session.id,
        consumedAt: null,
        replacedByVersion: null,
        createdAt: new Date(),
      });

      const accessToken = await this.tokenSigner.sign({
        sub: session.userId.toString(),
        sid: session.id.toString(),
        aal: session.assuranceLevel,
        roles: roleClaims,
      });

      const rotated = await this.sessionTokenRepository.rotate(
        freshToken,
        nextToken,
      );

      if (!rotated) {
        return left(new ConcurrentRefreshError());
      }

      session.touch();
      session.extendExpiration();
      await this.sessionRepository.save(session);

      return right({ accessToken, refreshToken: nextRefreshToken.plain });
    } finally {
      await this.refreshLockStore.release(
        initialSession.id.toString(),
        lockToken,
      );
    }
  }
}
