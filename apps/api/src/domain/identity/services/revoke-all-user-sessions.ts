import { SessionRevokeReason } from '../entities/session'
import { SessionRepository } from '../repositories/session-repository'
import { SessionTokenRepository } from '../repositories/session-token-repository'

export async function revokeAllUserSessions(
  sessionRepository: SessionRepository,
  sessionTokenRepository: SessionTokenRepository,
  userId: string,
  reason: SessionRevokeReason,
): Promise<void> {
  const sessions = await sessionRepository.findManyActiveByUserId(userId)

  for (const session of sessions) {
    session.revoke(new Date(), reason)
    await sessionRepository.save(session)
    await sessionTokenRepository.revokeAllBySessionId(session.id.toString())
  }
}
