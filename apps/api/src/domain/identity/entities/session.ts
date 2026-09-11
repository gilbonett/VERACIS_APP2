import { Entity } from '@/core/entities/entity'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'

const ROLLING_WINDOW_MS = 30 * 24 * 60 * 60 * 1000
const MAX_ABSOLUTE_LIFETIME_MS = 90 * 24 * 60 * 60 * 1000

export type SessionRevokeReason =
  | 'USER_LOGOUT'
  | 'ADMIN_REVOKED'
  | 'PASSWORD_CHANGED'
  | 'MFA_RESET'
  | 'TOKEN_REUSE'
  | 'ACCOUNT_DISABLED'
  | 'SECURITY_POLICY'

export type SessionAssuranceLevel = 'LOW' | 'MEDIUM' | 'HIGH'
export type SessionStatus = 'ACTIVE' | 'REVOKED' | 'EXPIRED'
const ASSURANCE_LEVEL_RANK: Record<SessionAssuranceLevel, number> = {
  LOW: 1,
  MEDIUM: 2,
  HIGH: 3,
}

export type SessionProps = {
  userId: UniqueEntityID
  ipAddress: string | null
  userAgent: string | null
  deviceName: string | null
  assuranceLevel: SessionAssuranceLevel

  authenticatedAt: Date
  lastActivityAt: Date
  expiresAt: Date
  revokedAt: Date | null
  revokeReason: string | null

  createdAt: Date
  updatedAt: Date
}

export class Session extends Entity<SessionProps> {
  get userId() {
    return this.props.userId
  }

  get assuranceLevel() {
    return this.props.assuranceLevel
  }

  get ipAddress() {
    return this.props.ipAddress
  }

  get userAgent() {
    return this.props.userAgent
  }

  get deviceName() {
    return this.props.deviceName
  }

  get authenticatedAt() {
    return this.props.authenticatedAt
  }

  get lastActivityAt() {
    return this.props.lastActivityAt
  }

  get expiresAt() {
    return this.props.expiresAt
  }

  get revokedAt() {
    return this.props.revokedAt
  }

  get revokeReason() {
    return this.props.revokeReason
  }

  get createdAt() {
    return this.props.createdAt
  }

  get updatedAt() {
    return this.props.updatedAt
  }

  get isRevoked() {
    return this.props.revokedAt !== null
  }

  get isExpired() {
    return this.props.expiresAt <= new Date()
  }

  get status(): SessionStatus {
    if (this.isRevoked) return 'REVOKED'
    if (this.isExpired) return 'EXPIRED'

    return 'ACTIVE'
  }

  get isActive() {
    return this.status === 'ACTIVE'
  }

  public elevateAssuranceLevel(level: SessionAssuranceLevel) {
    if (
      ASSURANCE_LEVEL_RANK[level] >
      ASSURANCE_LEVEL_RANK[this.props.assuranceLevel]
    ) {
      this.props.assuranceLevel = level
    }
  }

  public touch() {
    this.props.lastActivityAt = new Date()
  }

  public extendExpiration(now: Date = new Date()) {
    const absoluteCeiling = new Date(
      this.props.authenticatedAt.getTime() + MAX_ABSOLUTE_LIFETIME_MS,
    )

    if (now >= absoluteCeiling) {
      this.props.expiresAt = absoluteCeiling
      return
    }

    const rollingExpiry = new Date(now.getTime() + ROLLING_WINDOW_MS)

    this.props.expiresAt =
      rollingExpiry < absoluteCeiling ? rollingExpiry : absoluteCeiling
  }

  public revoke(at?: Date, reason?: SessionRevokeReason) {
    if (this.isRevoked) return

    this.props.revokedAt = at ?? new Date()
    this.props.revokeReason = reason ?? null
  }

  static create(props: SessionProps, id?: UniqueEntityID) {
    return new Session(props, id)
  }
}
