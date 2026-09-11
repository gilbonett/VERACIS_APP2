import { UseCaseError } from "@/core/errors/use-case-error";

export class PasswordInvalidError extends Error implements UseCaseError {
  constructor() {
    super(
      "A senha deve ter ao menos 8 caracteres, incluindo letra maiúscula, minúscula, número e caractere especial.",
    );
    this.name = "PasswordInvalidError";
  }
}
