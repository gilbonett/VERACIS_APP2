import { DomainError } from "@/core/errors/domain-error";

export class TwoFactorChallengeExpiredError
  extends Error
  implements DomainError
{
  constructor() {
    super("Desafio de verificação expirado ou já utilizado.");
  }
}
