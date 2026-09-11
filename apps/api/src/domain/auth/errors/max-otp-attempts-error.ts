import { UseCaseError } from "@/core/errors/use-case-error";

export class MaxOtpAttemptsError extends Error implements UseCaseError {
  constructor() {
    super("Você excedeu o número de tentativas. Faça login novamente para receber um novo código.");
    this.name = "MaxOtpAttemptsError";
  }
}
