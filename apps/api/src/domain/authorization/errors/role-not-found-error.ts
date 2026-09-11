import { DomainError } from "@/core/errors/domain-error";

export class RoleNotFoundError extends Error implements DomainError {
  constructor() {
    super("Perfil não encontrado.`");
    this.name = "RoleNotFoundError";
  }
}
