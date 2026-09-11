import { Either, left, right } from '@/core/either'
import { UseCase } from '@/core/use-case'
import { TokenOpaque } from '@/domain/cryptography/token-opaque'
import { Injectable } from '@nestjs/common'
import { ResetTokenInvalidError } from '../errors/reset-token-invalid-error'
import { PasswordResetRepository } from '../repositories/password-reset-repository'

interface ValidateResetTokenUseCaseRequest {
  token: string
}

type ValidateResetTokenUseCaseResponse = Either<ResetTokenInvalidError, void>

@Injectable()
export class ValidateResetTokenUseCase
  implements
    UseCase<ValidateResetTokenUseCaseRequest, ValidateResetTokenUseCaseResponse>
{
  constructor(
    private resetsRepository: PasswordResetRepository,
    private tokenOpaque: TokenOpaque,
  ) {}

  async execute({
    token,
  }: ValidateResetTokenUseCaseRequest): Promise<ValidateResetTokenUseCaseResponse> {
    const { hashed: tokenHash } = this.tokenOpaque.generate(token)
    const reset = await this.resetsRepository.findById(tokenHash)

    console.log(reset)

    if (!reset || !reset.isValid) return left(new ResetTokenInvalidError())

    return right(undefined)
  }
}
