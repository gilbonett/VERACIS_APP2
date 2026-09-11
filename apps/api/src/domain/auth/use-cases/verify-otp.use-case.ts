import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UseCase } from '@/core/use-case'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { Injectable } from '@nestjs/common'
import { Session } from '../entities/session'
import { ChallengeInvalidStateError } from '../errors/challenge-invalid-state-error'
import { ChallengeNotFoundError } from '../errors/challenge-not-found-error'
import { InvalidOtpCodeError } from '../errors/invalid-otp-code-error'
import { MaxOtpAttemptsError } from '../errors/max-otp-attempts-error'
import { OtpChallengeRepository } from '../repositories/otp-challenge-repository'
import { SessionRepository } from '../repositories/session-repository'

interface VerifyOtpUseCaseRequest {
  challengeToken: string
  code: string
  userAgent: string | null
  ipAddress: string | null
}

type VerifyOtpUseCaseResponse = Either<
  | ChallengeNotFoundError
  | ChallengeInvalidStateError
  | InvalidOtpCodeError
  | MaxOtpAttemptsError,
  { sessionToken: string }
>

@Injectable()
export class VerifyOtpUseCase
  implements UseCase<VerifyOtpUseCaseRequest, VerifyOtpUseCaseResponse>
{
  constructor(
    private challengeRepository: OtpChallengeRepository,
    private sessionRepository: SessionRepository,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute({
    challengeToken,
    code,
    userAgent,
    ipAddress,
  }: VerifyOtpUseCaseRequest): Promise<VerifyOtpUseCaseResponse> {
    const challenge = await this.challengeRepository.findById(challengeToken)
    if (!challenge) return left(new ChallengeNotFoundError())

    const { hashed: codeHash } = this.tokenOpaque.generate(code)

    const result = challenge.verifyCode(codeHash)

    if (result.isLeft()) {
      await this.challengeRepository.save(challenge)

      return left(result.value)
    }

    await this.challengeRepository.save(challenge)

    const { plain: sessionToken, hashed: sessionId } =
      this.tokenOpaque.generate('SESSION_TOKEN')

    const session = Session.create(
      { userId: challenge.userId, userAgent, ipAddress },
      new UniqueEntityID(sessionId),
    )

    await this.sessionRepository.create(session)

    return right({ sessionToken: sessionToken })
  }
}
