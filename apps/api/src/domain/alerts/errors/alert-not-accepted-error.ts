import { DomainError } from "@/core/errors/domain-error";

export class AlertNotAcceptedError extends Error implements DomainError {
  constructor() {
    super("Este alerta ainda não foi aceito pela comunidade.");
    this.name = "AlertNotAcceptedError";
  }
}
