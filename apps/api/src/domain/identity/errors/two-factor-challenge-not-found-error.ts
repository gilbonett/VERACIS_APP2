import { DomainError } from "@/core/errors/domain-error";

export class TwoFactorChallengeNotFoundError
  extends Error
  implements DomainError
{
  constructor() {
    super("Desafio de verificação não encontrado.");
  }
}
