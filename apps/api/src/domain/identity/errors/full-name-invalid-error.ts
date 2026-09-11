import { DomainError } from "@/core/errors/domain-error";

export class FullNameInvalidError extends Error implements DomainError {
  constructor() {
    super("O nome informado não é válido.");
    this.name = "FullNameInvalidError";
  }
}
