import { DomainError } from "@/core/errors/domain-error";

export class ProviderDiscoveryFailedError extends Error implements DomainError {
  constructor() {
    super("Não foi possível conectar ao provedor informado.");
  }
}
