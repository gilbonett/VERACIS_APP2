import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  SessionToken,
  SessionTokenProps,
} from '@/domain/identity/entities/session-token'

export function makeSessionToken(
  override: Partial<SessionTokenProps> = {},
  id?: UniqueEntityID,
): SessionToken {
  return SessionToken.create(
    {
      version: override.version ?? 0,
      tokenHash: override.tokenHash ?? 'hashed-secret',
      sessionId: override.sessionId ?? new UniqueEntityID(),
      consumedAt: override.consumedAt ?? null,
      replacedByVersion: override.replacedByVersion ?? null,
      createdAt: override.createdAt ?? new Date(),
    },
    id,
  )
}
