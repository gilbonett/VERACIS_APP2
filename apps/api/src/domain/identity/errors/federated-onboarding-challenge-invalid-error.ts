import { DomainError } from "@/core/errors/domain-error";

export class FederatedOnboardingChallengeInvalidError
  extends Error
  implements DomainError
{
  constructor() {
    super("Solicitação de cadastro complementar inválida ou expirada.");
  }
}
