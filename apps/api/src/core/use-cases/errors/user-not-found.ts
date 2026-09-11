import { DomainError } from "@/core/errors/domain-error";

export class UserNotFoundError extends Error implements DomainError {
  constructor() {
    super("Não foi possivel encontrar usuário cadastrado.");
    this.name = "UserNotFoundError";
  }
}
