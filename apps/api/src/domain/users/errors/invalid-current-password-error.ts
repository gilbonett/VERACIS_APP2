import { UseCaseError } from "@/core/errors/use-case-error";

export class InvalidCurrentPasswordError extends Error implements UseCaseError {
  constructor() {
    super("A senha atual está incorreta. Verifique e tente novamente.");
    this.name = "InvalidCurrentPasswordError";
  }
}
