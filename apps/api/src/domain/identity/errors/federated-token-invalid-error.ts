import { DomainError } from "@/core/errors/domain-error";

export class FederatedTokenInvalidError extends Error implements DomainError {
  constructor() {
    super(
      "Não foi possível validar a identidade retornada pelo provedor externo.",
    );
  }
}
