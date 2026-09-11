import { UseCaseError } from "@/core/errors/use-case-error";

export class SessionNotFoundError extends Error implements UseCaseError {
  constructor() {
    super("Sua sessão expirou. Faça login novamente.");
    this.name = "SessionNotFoundError";
  }
}
