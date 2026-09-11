import { SessionToken } from '@/domain/identity/entities/session-token'
import { SessionTokenRepository } from '@/domain/identity/repositories/session-token-repository'

export class InMemorySessionTokenRepository implements SessionTokenRepository {
  public items: SessionToken[] = []

  async create(token: SessionToken): Promise<void> {
    this.items.push(token)
  }

  async findByTokenHash(tokenHash: string): Promise<SessionToken | null> {
    return this.items.find((token) => token.tokenHash === tokenHash) ?? null
  }

  async rotate(
    currentToken: SessionToken,
    newToken: SessionToken,
  ): Promise<boolean> {
    const current = this.items.find(
      (token) => token.id.toString() === currentToken.id.toString(),
    )

    if (!current || current.isConsumed) {
      return false
    }

    current.consume(newToken.version)
    this.items.push(newToken)
    return true
  }

  async revokeAllBySessionId(sessionId: string): Promise<void> {
    for (const token of this.items) {
      if (token.sessionId.toString() === sessionId && !token.isConsumed) {
        token.revoke()
      }
    }
  }
}
