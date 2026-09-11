import { DomainError } from "@/core/errors/domain-error";

export class TooManyLoginAttemptsError extends Error implements DomainError {
  constructor() {
    super("Muitas tentativas de login, tente novamente mais tarde.");
    this.name = "TooManyLoginAttemptsError";
  }
}
