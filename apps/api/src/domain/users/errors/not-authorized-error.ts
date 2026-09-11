import { UseCaseError } from "@/core/errors/use-case-error";

export class NotAuthorizedError extends Error implements UseCaseError {
  constructor() {
    super("Você não tem permissão para fazer isso.");
    this.name = "NotAuthorizedError";
  }
}
