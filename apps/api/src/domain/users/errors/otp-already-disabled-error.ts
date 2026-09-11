import { UseCaseError } from "@/core/errors/use-case-error";

export class OtpAlreadyDisabledError extends Error implements UseCaseError {
  constructor() {
    super("A verificação em duas etapas já está desativada.");
  }
}
