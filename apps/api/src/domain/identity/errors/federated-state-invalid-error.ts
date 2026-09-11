import { DomainError } from "@/core/errors/domain-error";

export class FederatedStateInvalidError extends Error implements DomainError {
  constructor() {
    super("Sessão de login com o provedor externo inválida ou expirada.");
  }
}
