import { DomainError } from "@/core/errors/domain-error";

export class SlugAlreadyInUseError extends Error implements DomainError {
  constructor() {
    super("Já existe um provedor cadastrado com este identificador.");
  }
}
