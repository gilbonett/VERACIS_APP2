import { DomainError } from "@/core/errors/domain-error";

export class InvalidCredentialsError extends Error implements DomainError {
  message = "CPF ou senha incorretos. Verifique os dados e tente novamente.";

  constructor() {
    super("CPF ou senha incorretos. Verifique os dados e tente novamente.");
    this.name = "InvalidCredentialsError";
  }
}
