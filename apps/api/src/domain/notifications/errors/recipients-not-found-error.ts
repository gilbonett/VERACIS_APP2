import { DomainError } from "@/core/errors/domain-error";

export class RecipientsNotFoundError extends Error implements DomainError {
  constructor() {
    super("Não encontramos destinatário(s).");
    this.name = "RecipientsNotFoundError";
  }
}
