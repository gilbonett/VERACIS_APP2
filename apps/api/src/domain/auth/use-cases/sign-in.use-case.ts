import { Either, left, right } from '@/core/either'
import { UniqueEntityID } from '@/core/entities/unique-entity-id'
import { UseCase } from '@/core/use-case'
import { HashComparer } from '@/domain/cryptography/hash-comparer'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { UserRepository } from '@/domain/users/repositories/user-repository'
import { Injectable } from '@nestjs/common'
import { OtpChallenge } from '../entities/otp-challenge'
import { Session } from '../entities/session'
import { InvalidCredentialsError } from '../errors/invalid-credentials-error'
import { OtpChallengeRepository } from '../repositories/otp-challenge-repository'
import { SessionRepository } from '../repositories/session-repository'
import { Cpf } from '../value-objects/cpf'

interface SignInUseCaseRequest {
  cpf: string
  password: string
  userAgent: string | null
  ipAddress: string | null
}

type SignInUseCaseResponse = Either<
  InvalidCredentialsError,
  | { step: 'done'; sessionToken: string }
  | { step: 'otp_required'; challengeToken: string; maskEmail: string }
>

@Injectable()
export class SignInUseCase
  implements UseCase<SignInUseCaseRequest, SignInUseCaseResponse>
{
  constructor(
    private userRepository: UserRepository,
    private sessionRepository: SessionRepository,
    private challengeRepository: OtpChallengeRepository,
    private hashComparer: HashComparer,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute({
    cpf,
    password,
    userAgent,
    ipAddress,
  }: SignInUseCaseRequest): Promise<SignInUseCaseResponse> {
    const cpfOrError = Cpf.create(cpf)
    if (cpfOrError.isLeft()) return left(cpfOrError.value)

    const cpfValue = cpfOrError.value.toString()

    const user = await this.userRepository.findByCpf(cpfValue)
    if (!user) return left(new InvalidCredentialsError())
    if (!user.password) return left(new InvalidCredentialsError())

    const passwordMatches = await this.hashComparer.compare(
      password,
      user.password,
    )

    if (!passwordMatches) return left(new InvalidCredentialsError())

    if (!user.otpEnabled) {
      const { plain: sessionToken, hashed: sessionId } =
        this.tokenOpaque.generate('SESSION_TOKEN')

      const session = Session.create(
        { userId: user.id, userAgent, ipAddress },
        new UniqueEntityID(sessionId),
      )

      await this.sessionRepository.create(session)

      return right({ step: 'done', sessionToken })
    }

    await this.challengeRepository.expirePendingByUserId(user.id.toString())

    const challenge = OtpChallenge.create(user.id, user.email)
    await this.challengeRepository.create(challenge)

    return right({
      step: 'otp_required',
      challengeToken: challenge.id.toString(),
      maskEmail: user.emailMasked,
    })
  }
}
