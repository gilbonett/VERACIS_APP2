import { DomainError } from "@/core/errors/domain-error";

export class RiskAlreadyExistsError extends Error implements DomainError {
  constructor() {
    super("Já existe um risco com esse nome.");
    this.name = "RiskAlreadyExistsError";
  }
}
