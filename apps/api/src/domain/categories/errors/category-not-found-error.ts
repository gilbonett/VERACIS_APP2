import { DomainError } from "@/core/errors/domain-error";

export class CategoryNotFoundError extends Error implements DomainError {
  constructor() {
    super("Não encontramos esta categoria.");
  }
}
