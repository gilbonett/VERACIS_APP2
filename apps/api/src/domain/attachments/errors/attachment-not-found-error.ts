import { DomainError } from "@/core/errors/domain-error";

export class AttachmentNotFoundError extends Error implements DomainError {
  constructor() {
    super("Arquivo não encontrado");
  }
}
