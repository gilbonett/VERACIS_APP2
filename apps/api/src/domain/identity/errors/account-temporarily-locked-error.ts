import { DomainError } from "@/core/errors/domain-error";

export class AccountTemporarilyLockedError
  extends Error
  implements DomainError
{
  constructor() {
    super(
      "Conta bloqueada temporariamente por excesso de tentativas. Tente novamente mais tarde.",
    );
    this.name = "AccountTemporarilyLockedError";
  }
}
