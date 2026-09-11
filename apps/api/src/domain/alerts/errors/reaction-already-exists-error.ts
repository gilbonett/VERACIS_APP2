import { DomainError } from "@/core/errors/domain-error";

export class ReactionAlreadyExistsError extends Error implements DomainError {
  constructor() {
    super("Você já confirmou este alerta.");
    this.name = "ReactionAlreadyExistsError";
  }
}
