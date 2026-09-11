import { DomainError } from '@/core/errors/domain-error'

/**
 * Raised when a refresh loses an atomic CAS race against a concurrent refresh
 * of the same token. This is normal concurrency, NOT token reuse — the session
 * must NOT be revoked.
 */
export class ConcurrentRefreshError extends Error implements DomainError {
  constructor() {
    super('Refresh concorrente detectado. Tente novamente.')
  }
}
