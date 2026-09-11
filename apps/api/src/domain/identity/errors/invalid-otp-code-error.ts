import { DomainError } from "@/core/errors/domain-error";

export class InvalidOtpCodeError extends Error implements DomainError {
  constructor() {
    super("Código inválido.");
  }
}
