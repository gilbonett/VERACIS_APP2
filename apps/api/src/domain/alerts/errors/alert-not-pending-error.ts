import { DomainError } from "@/core/errors/domain-error";

export class AlertNotPendingError extends Error implements DomainError {
  constructor() {
    super("Este alerta não está mais em análise.");
    this.name = "AlertNotPendingError";
  }
}
