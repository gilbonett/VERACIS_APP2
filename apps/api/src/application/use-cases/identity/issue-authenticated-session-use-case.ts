import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserRoleAssignmentRepository } from "@/domain/authorization/repositories/user-role-assignment-repository";
import { TokenOpaque } from "@/domain/cryptography/token-opaque";
import { TokenSigner } from "@/domain/cryptography/token-signer";
import {
  Session,
  SessionAssuranceLevel,
} from "@/domain/identity/entities/session";
import { SessionToken } from "@/domain/identity/entities/session-token";
import { SessionRepository } from "@/domain/identity/repositories/session-repository";
import { SessionTokenRepository } from "@/domain/identity/repositories/session-token-repository";
import { resolveRoleClaims } from "@/domain/identity/services/resolve-role-claims";
import { days } from "@/shared/constants/temporal.constants";
import { Injectable } from "@nestjs/common";

const SESSION_INITIAL_TTL_MS = days(30);

export interface IssueAuthenticatedSessionRequest {
  userId: string;
  assuranceLevel: SessionAssuranceLevel;
  ipAddress: string | null;
  userAgent: string | null;
  deviceName: string | null;
}

export interface IssueAuthenticatedSessionResponse {
  accessToken: string;
  refreshToken: string;
}

@Injectable()
export class IssueAuthenticatedSessionUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private sessionTokenRepository: SessionTokenRepository,
    private userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private tokenOpaque: TokenOpaque,
    private tokenSigner: TokenSigner,
  ) {}

  async execute(
    request: IssueAuthenticatedSessionRequest,
  ): Promise<IssueAuthenticatedSessionResponse> {
    const roleClaims = await resolveRoleClaims(
      this.userRoleAssignmentRepository,
      request.userId.toString(),
    );

    const session = Session.create({
      userId: new UniqueEntityID(request.userId),
      createdAt: new Date(),
      updatedAt: new Date(),
      assuranceLevel: request.assuranceLevel,
      ipAddress: request.ipAddress,
      userAgent: request.userAgent,
      deviceName: request.deviceName,
      authenticatedAt: new Date(),
      lastActivityAt: new Date(),
      expiresAt: new Date(Date.now() + SESSION_INITIAL_TTL_MS),
      revokeReason: null,
      revokedAt: null,
    });

    await this.sessionRepository.create(session);

    const refreshToken = this.tokenOpaque.generate();

    const sessionToken = SessionToken.create({
      version: 0,
      tokenHash: refreshToken.hashed,
      sessionId: session.id,
      consumedAt: null,
      replacedByVersion: null,
      createdAt: new Date(),
    });

    await this.sessionTokenRepository.create(sessionToken);

    const accessToken = await this.tokenSigner.sign({
      sub: request.userId.toString(),
      sid: session.id.toString(),
      aal: request.assuranceLevel,
      roles: roleClaims,
    });

    return { accessToken, refreshToken: refreshToken.plain };
  }
}
