import { UseCaseError } from "@/core/errors/use-case-error";

export class AccountAlreadyDisabledError extends Error implements UseCaseError {
  constructor() {
    super("Sua conta já está desativada.");
    this.name = "AccountAlreadyDisabledError";
  }
}
