import { UseCaseError } from "@/core/errors/use-case-error";

export class ResetTokenInvalidError extends Error implements UseCaseError {
  constructor() {
    super("Este link expirou ou já foi usado. Solicite um novo link de redefinição.");
    this.name = "ResetTokenInvalidError";
  }
}
