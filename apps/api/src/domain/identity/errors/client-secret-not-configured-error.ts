import { DomainError } from "@/core/errors/domain-error";

export class ClientSecretNotConfiguredError
  extends Error
  implements DomainError
{
  constructor() {
    super("O client secret do provedor não foi informado.");
  }
}
