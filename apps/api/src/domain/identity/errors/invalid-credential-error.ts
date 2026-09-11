import { DomainError } from "@/core/errors/domain-error";

export class InvalidCredentialsError extends Error implements DomainError {
  constructor() {
    super("Credenciais inválidas.");
    this.name = "InvalidCredentialsError";
  }
}
