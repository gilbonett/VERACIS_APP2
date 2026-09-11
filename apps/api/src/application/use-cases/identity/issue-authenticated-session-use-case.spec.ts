import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UserRoleAssignment } from '@/domain/authorization/entities/user-role-assignment'
import { Session } from '@/domain/identity/entities/session'
import { SessionToken } from '@/domain/identity/entities/session-token'
import { FakeTokenSigner } from '../../../../test/cryptography/fake-token-signer'
import { FakeTokenOpaque } from '../../../../test/cryptography/fake-token-opaque'
import { InMemorySessionRepository } from '../../../../test/repositories/in-memory-session-repository'
import { InMemorySessionTokenRepository } from '../../../../test/repositories/in-memory-session-token-repository'
import { InMemoryUserRoleAssignmentRepository } from '../../../../test/repositories/in-memory-user-role-assignment-repository'
import {
  IssueAuthenticatedSessionRequest,
  IssueAuthenticatedSessionUseCase,
} from './issue-authenticated-session-use-case'

let sut: IssueAuthenticatedSessionUseCase
let inMemorySessionRepository: InMemorySessionRepository
let inMemorySessionTokenRepository: InMemorySessionTokenRepository
let inMemoryUserRoleAssignmentRepository: InMemoryUserRoleAssignmentRepository
let fakeTokenOpaque: FakeTokenOpaque
let fakeTokenSigner: FakeTokenSigner

const validRequest = {
  userId: 'user-01',
  assuranceLevel: 'LOW',
  ipAddress: '10.0.0.1',
  userAgent: 'vitest',
  deviceName: 'vitest-device',
} satisfies IssueAuthenticatedSessionRequest

describe('Issue Authenticated Session Use Case', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository()
    inMemorySessionTokenRepository = new InMemorySessionTokenRepository()
    inMemoryUserRoleAssignmentRepository =
      new InMemoryUserRoleAssignmentRepository()
    fakeTokenOpaque = new FakeTokenOpaque()
    fakeTokenSigner = new FakeTokenSigner()

    sut = new IssueAuthenticatedSessionUseCase(
      inMemorySessionRepository,
      inMemorySessionTokenRepository,
      inMemoryUserRoleAssignmentRepository,
      fakeTokenOpaque,
      fakeTokenSigner,
    )
  })

  describe('when issuing an authenticated session', () => {
    let before: number
    let after: number
    let result: Awaited<ReturnType<typeof sut.execute>>
    let session: Session
    let storedToken: SessionToken
    let payload: ReturnType<typeof JSON.parse>

    beforeEach(async () => {
      before = Date.now()
      result = await sut.execute(validRequest)
      after = Date.now()

      session = inMemorySessionRepository.items[0]
      storedToken = inMemorySessionTokenRepository.items[0]
      payload = JSON.parse(result.accessToken)
    })

    it('should persist a session with the requested assurance level', () => {
      expect(session).toBeDefined()
      expect(session.assuranceLevel).toBe('LOW')
    })

    it('should stamp authenticatedAt and lastActivityAt within the execution window', () => {
      expect(session.authenticatedAt.getTime()).toBeGreaterThanOrEqual(before)
      expect(session.authenticatedAt.getTime()).toBeLessThanOrEqual(after)
      expect(session.lastActivityAt.getTime()).toBeGreaterThanOrEqual(before)
      expect(session.lastActivityAt.getTime()).toBeLessThanOrEqual(after)
    })

    it('should expire roughly 30 days from now', () => {
      const expectedTtlMs = 30 * 24 * 60 * 60 * 1000
      expect(session.expiresAt.getTime()).toBeGreaterThanOrEqual(
        before + expectedTtlMs - 1000,
      )
      expect(session.expiresAt.getTime()).toBeLessThanOrEqual(
        after + expectedTtlMs + 1000,
      )
    })

    it('should persist a SessionToken at version 0 scoped to the session id', () => {
      expect(storedToken).toBeDefined()
      expect(storedToken.sessionId.toString()).toBe(session.id.toString())
      expect(storedToken.version).toBe(0)
      expect(storedToken.isConsumed).toBe(false)
      expect(storedToken.tokenHash).toBe(
        fakeTokenOpaque.generate(result.refreshToken).hashed,
      )
    })

    it('should return the plain opaque refresh token secret', () => {
      expect(result.refreshToken).toBeTruthy()
      expect(result.refreshToken).not.toContain('.')
    })

    it('should sign the access token with sub, sid and aal claims', () => {
      expect(payload.sub).toBe(validRequest.userId)
      expect(payload.sid).toBe(session.id.toString())
      expect(payload.aal).toBe('LOW')
    })

    it('should return an empty roles array when the user has no role assignments', () => {
      expect(payload.roles).toEqual([])
    })
  })

  describe('when the user has role assignments', () => {
    const roleId = new UniqueEntityID('role-01')
    let payload: ReturnType<typeof JSON.parse>

    beforeEach(async () => {
      const otherRoleId = new UniqueEntityID('role-02')

      inMemoryUserRoleAssignmentRepository.items.push(
        UserRoleAssignment.create({
          userId: new UniqueEntityID(validRequest.userId),
          roleId,
          scopeType: 'communityId',
          scopeValue: 'community-01',
          assignedByUserId: null,
          assignedAt: new Date(),
        }),
        UserRoleAssignment.create({
          userId: new UniqueEntityID('other-user'),
          roleId: otherRoleId,
          scopeType: 'communityId',
          scopeValue: 'community-02',
          assignedByUserId: null,
          assignedAt: new Date(),
        }),
      )

      const result = await sut.execute(validRequest)
      payload = JSON.parse(result.accessToken)
    })

    it('should resolve roles exactly matching the seeded assignments for the user', () => {
      expect(payload.roles).toEqual([
        {
          roleId: roleId.toString(),
          scopeType: 'communityId',
          scopeValue: 'community-01',
        },
      ])
    })
  })
})
