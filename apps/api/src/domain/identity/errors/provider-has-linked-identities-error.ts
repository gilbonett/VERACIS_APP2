import { DomainError } from "@/core/errors/domain-error";

export class ProviderHasLinkedIdentitiesError
  extends Error
  implements DomainError
{
  constructor() {
    super("Não é possível remover um provedor com identidades vinculadas.");
  }
}
