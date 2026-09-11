import { Session } from '@/domain/identity/entities/session'
import { SessionRepository } from '@/domain/identity/repositories/session-repository'

export class InMemorySessionRepository implements SessionRepository {
  public items: Session[] = []

  async create(session: Session): Promise<void> {
    this.items.push(session)
  }

  async findById(id: string): Promise<Session | null> {
    return this.items.find((session) => session.id.toString() === id) ?? null
  }

  async findManyActiveByUserId(userId: string): Promise<Session[]> {
    return this.items.filter(
      (session) =>
        session.userId.toString() === userId &&
        !session.isRevoked &&
        !session.isExpired,
    )
  }

  async save(session: Session): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === session.id.toString(),
    )
    if (index !== -1) {
      this.items[index] = session
    } else {
      this.items.push(session)
    }
  }

  async revoke(session: Session): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === session.id.toString(),
    )
    if (index !== -1) {
      this.items[index] = session
    }
  }

  async revokeAllByUserId(userId: string): Promise<Session[]> {
    const sessions = this.items.filter(
      (session) => session.userId.toString() === userId && !session.isRevoked,
    )

    for (const session of sessions) {
      session.revoke()
    }

    return sessions
  }
}
