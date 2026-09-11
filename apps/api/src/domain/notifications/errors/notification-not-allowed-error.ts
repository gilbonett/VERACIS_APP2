import { DomainError } from "@/core/errors/domain-error";

export class NotificationNotAllowedError extends Error implements DomainError {
  constructor() {
    super("Você não tem permissão para acessar esta notificação.");
    this.name = "NotificationNotAllowedError";
  }
}
