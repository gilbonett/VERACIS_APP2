import { DomainError } from "@/core/errors/domain-error";

export class NotificationNotFoundError extends Error implements DomainError {
  constructor() {
    super("Não encontramos esta notificação.");
    this.name = "NotificationNotFoundError";
  }
}
