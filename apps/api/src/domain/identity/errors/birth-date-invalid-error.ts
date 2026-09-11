import { DomainError } from "@/core/errors/domain-error";

export class BirthDateInvalidError extends Error implements DomainError {
  constructor() {
    super("A data de nascimento informada não é válida.");
    this.name = "BirthDateInvalidError";
  }
}
