import { DomainError } from "@/core/errors/domain-error";

export class TwoFactorMethodNotAvailableError
  extends Error
  implements DomainError
{
  constructor() {
    super("Método de autenticação em duas etapas indisponível.");
  }
}
