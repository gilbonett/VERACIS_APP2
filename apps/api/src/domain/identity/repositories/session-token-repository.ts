import { SessionToken } from '../entities/session-token'

export abstract class SessionTokenRepository {
  abstract create(token: SessionToken): Promise<void>

  abstract findByTokenHash(tokenHash: string): Promise<SessionToken | null>

  abstract rotate(
    currentToken: SessionToken,
    newToken: SessionToken,
  ): Promise<boolean>

  abstract revokeAllBySessionId(sessionId: string): Promise<void>
}
