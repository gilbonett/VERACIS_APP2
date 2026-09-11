import { UseCaseError } from "@/core/errors/use-case-error";

export class ChallengeNotFoundError extends Error implements UseCaseError {
  message = "Seu código de verificação expirou. Solicite um novo.";
  constructor() {
    super("Seu código de verificação expirou. Solicite um novo.");
    this.name = "ChallengeNotFoundError";
  }
}
