import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import {
  Verification,
  VerificationProps,
} from '@/domain/identities/entities/verification'
import { TokenExpiration } from '@/domain/value-objects/token-expiration'

export function makeVerification(
  override: Partial<VerificationProps> = {},
  id?: UniqueEntityID,
): Verification {
  const auth = Verification.create(
    {
      expiresAt: override.expiresAt ?? TokenExpiration.fromMinutes(2),
      identifier: override.identifier ?? 'any-identifier',
      value: override.value ?? '123456',
      createdAt: override.createdAt ?? new Date(),
      ...override,
    },
    id,
  )

  return auth
}
