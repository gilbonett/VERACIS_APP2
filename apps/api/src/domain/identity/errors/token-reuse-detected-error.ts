import { DomainError } from "@/core/errors/domain-error";

export class TokenReuseDetectedError extends Error implements DomainError {
  constructor() {
    super("Reuso de refresh token detectado. Sessão revogada.");
  }
}
