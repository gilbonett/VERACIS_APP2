import { Either, right } from '@/core/either'
import { SessionRevokeReason } from '@/domain/identity/entities/session'
import { SessionRepository } from '@/domain/identity/repositories/session-repository'
import { SessionTokenRepository } from '@/domain/identity/repositories/session-token-repository'
import { Injectable } from '@nestjs/common'

const USER_LOGOUT_REASON: SessionRevokeReason = 'USER_LOGOUT'

interface LogoutUseCaseRequest {
  sessionId: string
}

type LogoutUseCaseResponse = Either<never, void>

@Injectable()
export class LogoutUseCase {
  constructor(
    private sessionRepository: SessionRepository,
    private sessionTokenRepository: SessionTokenRepository,
  ) {}

  async execute(request: LogoutUseCaseRequest): Promise<LogoutUseCaseResponse> {
    const session = await this.sessionRepository.findById(request.sessionId)

    if (!session || session.isRevoked) {
      return right(undefined)
    }

    session.revoke(new Date(), USER_LOGOUT_REASON)
    await this.sessionRepository.save(session)
    await this.sessionTokenRepository.revokeAllBySessionId(request.sessionId)

    return right(undefined)
  }
}
