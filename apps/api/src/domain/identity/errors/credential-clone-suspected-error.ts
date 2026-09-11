import { UseCaseError } from "@/core/errors/use-case-error";

export class CredentialCloneSuspectedError
  extends Error
  implements UseCaseError
{
  constructor() {
    super("Credencial de segurança pode estar comprometida.");
    this.name = "CredentialCloneSuspectedError";
  }
}
