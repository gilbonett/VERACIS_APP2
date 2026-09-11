import { UseCaseError } from "@/core/errors/use-case-error";

export class OtpAlreadyEnabledError extends Error implements UseCaseError {
  constructor() {
    super("A verificação em duas etapas já está ativada.");
    this.name = "OtpAlreadyEnabledError";
  }
}
