import { UseCaseError } from "@/core/errors/use-case-error";

export class AccountAlreadyActiveError extends Error implements UseCaseError {
  constructor() {
    super("Sua conta já está ativa.");
    this.name = "AccountAlreadyActiveError";
  }
}
