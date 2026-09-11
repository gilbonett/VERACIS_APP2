import { DomainError } from "@/core/errors/domain-error";

export class ProviderNotAvailableError extends Error implements DomainError {
  constructor() {
    super("Provedor de login indisponível.");
  }
}
