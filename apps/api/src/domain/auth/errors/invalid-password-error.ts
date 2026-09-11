import { UseCaseError } from "@/core/errors/use-case-error";

export class InvalidPasswordError extends Error implements UseCaseError {
  constructor() {
    super("A senha informada está incorreta.");
    this.name = "InvalidPasswordError";
  }
}
