import { DomainError } from "@/core/errors/domain-error"; // ajuste pro caminho/base real do seu projeto

export class LoginAttemptNotFoundError extends Error implements DomainError {
  constructor() {
    super("Tentativa de login não encontrada ou expirada.");
  }
}
