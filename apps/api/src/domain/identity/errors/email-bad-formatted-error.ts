import { DomainError } from "@/core/errors/domain-error";

export class EmailBadFormattedError extends Error implements DomainError {
  constructor() {
    super("O e-mail informado não é válido.");
    this.name = "EmailBadFormattedError";
  }
}
