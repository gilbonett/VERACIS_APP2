import { UseCaseError } from "@/core/errors/use-case-error";

export class InvalidOtpCodeError extends Error implements UseCaseError {
  constructor() {
    super("Código inválido ou expirado. Solicite um novo código.");
    this.name = "InvalidOtpCodeError";
  }
}
