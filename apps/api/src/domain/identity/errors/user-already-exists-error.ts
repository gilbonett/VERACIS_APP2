import { UseCaseError } from "@/core/errors/use-case-error";

export class UserAlreadyExistsError extends Error implements UseCaseError {
  constructor() {
    super("Não foi possível concluir o cadastro");
    this.name = "UserAlreadyExistsError";
  }
}
