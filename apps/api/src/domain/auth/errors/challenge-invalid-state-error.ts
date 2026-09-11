import { UseCaseError } from "@/core/errors/use-case-error";

export class ChallengeInvalidStateError extends Error implements UseCaseError {
  constructor(
    public expected: string,
    public got: string,
  ) {
    super("Sua sessão de verificação expirou. Por favor, comece novamente.");
    this.name = "ChallengeInvalidStateError";
  }
}
