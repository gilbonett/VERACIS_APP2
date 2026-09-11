import { makeSession } from '../../../../test/factories/make-session'
import { makeSessionToken } from '../../../../test/factories/make-session-token'
import { InMemorySessionRepository } from '../../../../test/repositories/in-memory-session-repository'
import { InMemorySessionTokenRepository } from '../../../../test/repositories/in-memory-session-token-repository'
import { LogoutUseCase } from './logout-use-case'

let sut: LogoutUseCase
let inMemorySessionRepository: InMemorySessionRepository
let inMemorySessionTokenRepository: InMemorySessionTokenRepository

describe('Logout Use Case', () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository()
    inMemorySessionTokenRepository = new InMemorySessionTokenRepository()

    sut = new LogoutUseCase(
      inMemorySessionRepository,
      inMemorySessionTokenRepository,
    )
  })

  it('should be idempotent and not touch the token repository when the session is not found', async () => {
    const revokeSpy = vi.spyOn(
      inMemorySessionTokenRepository,
      'revokeAllBySessionId',
    )

    const result = await sut.execute({ sessionId: 'missing-session-id' })

    expect(result.isRight()).toBe(true)
    expect(revokeSpy).not.toHaveBeenCalled()
  })

  it('should be idempotent and not touch the token repository when the session is already revoked', async () => {
    const session = makeSession()
    session.revoke()
    inMemorySessionRepository.items.push(session)

    const revokeSpy = vi.spyOn(
      inMemorySessionTokenRepository,
      'revokeAllBySessionId',
    )

    const result = await sut.execute({ sessionId: session.id.toString() })

    expect(result.isRight()).toBe(true)
    expect(revokeSpy).not.toHaveBeenCalled()
  })

  describe('when the session is active', () => {
    let result: Awaited<ReturnType<typeof sut.execute>>

    beforeEach(async () => {
      const session = makeSession()
      inMemorySessionRepository.items.push(session)

      const token = makeSessionToken({ sessionId: session.id })
      inMemorySessionTokenRepository.items.push(token)

      result = await sut.execute({ sessionId: session.id.toString() })
    })

    it('should return success', () => {
      expect(result.isRight()).toBe(true)
    })

    it('should revoke the session', () => {
      expect(inMemorySessionRepository.items[0].isRevoked).toBe(true)
    })

    it("should consume the session's tokens", () => {
      expect(inMemorySessionTokenRepository.items[0].isConsumed).toBe(true)
    })
  })
})
