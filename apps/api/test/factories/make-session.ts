import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { Session, SessionProps } from '@/domain/identity/entities/session'

export function makeSession(
  override: Partial<SessionProps> = {},
  id?: UniqueEntityID,
): Session {
  return Session.create(
    {
      userId: override.userId ?? new UniqueEntityID(),
      ipAddress: override.ipAddress ?? '127.0.0.1',
      userAgent: override.userAgent ?? 'vitest',
      deviceName: override.deviceName ?? 'vitest-device',
      assuranceLevel: override.assuranceLevel ?? 'LOW',
      authenticatedAt: override.authenticatedAt ?? new Date(),
      lastActivityAt: override.lastActivityAt ?? new Date(),
      expiresAt: override.expiresAt ?? new Date(Date.now() + 1000 * 60 * 60),
      revokedAt: override.revokedAt ?? null,
      revokeReason: override.revokeReason ?? null,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? new Date(),
    },
    id,
  )
}
