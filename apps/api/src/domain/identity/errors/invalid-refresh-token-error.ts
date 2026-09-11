import { DomainError } from "@/core/errors/domain-error";

export class InvalidRefreshTokenError extends Error implements DomainError {
  constructor() {
    super("Refresh token inválido.");
  }
}
