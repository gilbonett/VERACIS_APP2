import { UseCase } from '@/core/use-case'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { UserRepository } from '@/domain/users/repositories/user-repository'
import { Injectable } from '@nestjs/common'
import { PasswordReset } from '../entities/password-reset'
import { PasswordResetRepository } from '../repositories/password-reset-repository'

interface RequestPasswordResetUseCaseRequest {
  email: string
}

@Injectable()
export class RequestPasswordResetUseCase
  implements UseCase<RequestPasswordResetUseCaseRequest, void>
{
  constructor(
    private userRepository: UserRepository,
    private passwordResetRepository: PasswordResetRepository,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute({ email }: RequestPasswordResetUseCaseRequest): Promise<void> {
    const user = await this.userRepository.findByEmail(email)

    if (!user) return

    await this.passwordResetRepository.expirePendingByUserId(user.id.toString())

    const { plain: tokenPlain, hashed: tokenHash } = this.tokenOpaque.generate(
      'PASSWORD_RESET_TOKEN',
    )

    const reset = PasswordReset.create(
      user.id,
      email,
      user.emailMasked,
      user.name,
      tokenHash,
      tokenPlain,
    )

    await this.passwordResetRepository.create(reset)
  }
}
