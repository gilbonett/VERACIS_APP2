import { DomainError } from "@/core/errors/domain-error";

export class OtpAttemptsExceededError extends Error implements DomainError {
  constructor() {
    super("Número máximo de tentativas excedido. Solicite um novo código.");
  }
}
