import { Either, left, right } from '@/core/either'
import { UseCase } from '@/core/use-case'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { Injectable } from '@nestjs/common'
import { SessionNotFoundError } from '../errors/session-not-found-error'
import { SessionRepository } from '../repositories/session-repository'

interface SignOutUseCaseRequest {
  rawToken: string
}

type SignOutUseCaseResponse = Either<
  SessionNotFoundError,
  {
    message: string
  }
>

@Injectable()
export class SignOutUseCase
  implements UseCase<SignOutUseCaseRequest, SignOutUseCaseResponse>
{
  constructor(
    private sessionRepository: SessionRepository,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute({
    rawToken,
  }: SignOutUseCaseRequest): Promise<SignOutUseCaseResponse> {
    const { hashed: sessionId } = this.tokenOpaque.generate(rawToken)

    const session = await this.sessionRepository.findById(sessionId)

    if (!session) return left(new SessionNotFoundError())

    await this.sessionRepository.delete(session)

    return right({
      message: 'Session signed out successfully',
    })
  }
}
