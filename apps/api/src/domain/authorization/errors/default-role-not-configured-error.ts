import { UseCaseError } from "@/core/errors/use-case-error";

export class DefaultRoleNotConfiguredError
  extends Error
  implements UseCaseError
{
  constructor() {
    super("Perfil padrão não configurado.");
    this.name = "DefaultRoleNotConfiguredError";
  }
}
