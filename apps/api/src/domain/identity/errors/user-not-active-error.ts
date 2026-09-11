import { DomainError } from "@/core/errors/domain-error";

export class UserNotActiveError extends Error implements DomainError {
  constructor() {
    super("Usuário possui a conta desativada");
    this.name = "UserNotActiveError";
  }
}
