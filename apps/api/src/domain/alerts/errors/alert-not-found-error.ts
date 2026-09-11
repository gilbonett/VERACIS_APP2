import { DomainError } from "@/core/errors/domain-error";

export class AlertNotFoundError extends Error implements DomainError {
  constructor() {
    super("Não encontramos este alerta.");
    this.name = "AlertNotFoundError";
  }
}
