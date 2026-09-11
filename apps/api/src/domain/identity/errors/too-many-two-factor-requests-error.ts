import { DomainError } from "@/core/errors/domain-error";

export class TooManyTwoFactorRequestsError
  extends Error
  implements DomainError
{
  constructor() {
    super(
      "Muitas solicitações de código em pouco tempo. Aguarde antes de tentar novamente.",
    );
  }
}
