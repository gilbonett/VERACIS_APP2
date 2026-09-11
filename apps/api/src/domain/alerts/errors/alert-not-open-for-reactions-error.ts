import { DomainError } from "@/core/errors/domain-error";

export class AlertNotOpenForReactionsError
  extends Error
  implements DomainError
{
  constructor() {
    super("Este alerta não aceita mais confirmações.");
    this.name = "AlertNotOpenForReactionsError";
  }
}
