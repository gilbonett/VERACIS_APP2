import { DomainError } from "@/core/errors/domain-error";

export class CpfBadValidError extends Error implements DomainError {
  constructor() {
    super("O CPF informado não é válido.");
    this.name = "CpfBadValidError";
  }
}
