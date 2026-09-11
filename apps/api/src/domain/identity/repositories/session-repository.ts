import { Session } from '../entities/session'

export abstract class SessionRepository {
  abstract create(session: Session): Promise<void>
  abstract findById(id: string): Promise<Session | null>
  abstract findManyActiveByUserId(userId: string): Promise<Session[]>
  abstract save(session: Session): Promise<void>
  abstract revoke(session: Session): Promise<void>
  abstract revokeAllByUserId(userId: string): Promise<Session[]>
}
