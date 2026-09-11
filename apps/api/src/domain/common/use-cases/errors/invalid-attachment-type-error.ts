import { DomainError } from "@/core/errors/domain-error";

export class InvalidAttachmentTypeError extends Error implements DomainError {
  constructor(type: string) {
    super(`O arquivo do tipo "${type}" não é permitido.`);
  }
}
