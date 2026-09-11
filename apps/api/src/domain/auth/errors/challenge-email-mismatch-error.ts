import { DomainError } from "@/core/errors/domain-error";

export class ChallengeEmailMismatchError extends Error implements DomainError {
  constructor() {
    super("O e-mail informado não corresponde ao cadastrado.");
    this.name = "ChallengeEmailMismatchError";
  }
}
