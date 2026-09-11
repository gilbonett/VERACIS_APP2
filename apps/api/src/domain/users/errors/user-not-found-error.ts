import { UseCaseError } from "@/core/errors/use-case-error";

export class UserNotFoundError extends Error implements UseCaseError {
  message = "Não encontramos uma conta com esses dados.";
  constructor() {
    super("Não encontramos uma conta com esses dados.");
    this.name = "UserNotFoundError";
  }
}
