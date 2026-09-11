import { DomainError } from "@/core/errors/domain-error";

export class PasswordResetTokenInvalidError
  extends Error
  implements DomainError
{
  constructor() {
    super("Token de redefinição de senha inválido ou expirado.");
  }
}
