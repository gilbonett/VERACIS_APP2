import { Either, left, right } from '@/core/either'
import { UseCase } from '@/core/use-case'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { UserRepository } from '@/domain/users/repositories/user-repository'
import { Injectable } from '@nestjs/common'
import { InvalidPasswordError } from '../errors/invalid-password-error'
import { ResetTokenInvalidError } from '../errors/reset-token-invalid-error'
import { PasswordResetRepository } from '../repositories/password-reset-repository'
import { SessionRepository } from '../repositories/session-repository'

interface ConfirmPasswordResetUseCaseRequest {
  token: string
  newPassword: string
}

type ConfirmPasswordResetUseCaseResponse = Either<
  ResetTokenInvalidError | InvalidPasswordError,
  {
    message: string
  }
>

@Injectable()
export class ConfirmPasswordResetUseCase
  implements
    UseCase<
      ConfirmPasswordResetUseCaseRequest,
      ConfirmPasswordResetUseCaseResponse
    >
{
  constructor(
    private userRepository: UserRepository,
    private resetRepository: PasswordResetRepository,
    private sessionRepository: SessionRepository,
    private hashGenerator: HashGenerator,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute({
    token,
    newPassword,
  }: ConfirmPasswordResetUseCaseRequest): Promise<ConfirmPasswordResetUseCaseResponse> {
    if (newPassword.length < 8) {
      return left(new InvalidPasswordError())
    }

    const { hashed: tokenHash } = this.tokenOpaque.generate(token)
    const reset = await this.resetRepository.findById(tokenHash)
    if (!reset) return left(new ResetTokenInvalidError())

    const consumeResult = reset.consume()
    if (consumeResult.isLeft()) return left(consumeResult.value)

    const passwordHash = await this.hashGenerator.hash(newPassword)

    await this.userRepository.updatePassword(
      reset.userId.toString(),
      passwordHash,
    )
    await this.resetRepository.save(reset)
    await this.sessionRepository.deleteAllByUserId(reset.userId.toString())

    return right({
      message: 'Password reset successfully.',
    })
  }
}
