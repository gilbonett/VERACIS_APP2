import { DomainError } from "@/core/errors/domain-error";

export class FederatedProviderNotFoundError
  extends Error
  implements DomainError
{
  constructor() {
    super("Provedor federado não encontrado.");
  }
}
