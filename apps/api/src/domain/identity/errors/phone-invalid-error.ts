import { DomainError } from "@/core/errors/domain-error";

export class PhoneInvalidError extends Error implements DomainError {
  constructor() {
    super("O telefone informado não é válido.");
    this.name = "PhoneInvalidError";
  }
}
