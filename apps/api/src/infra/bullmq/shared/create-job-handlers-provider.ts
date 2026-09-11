import { Provider, Type } from "@nestjs/common";
import { JobHandler } from "./job-handler.contract";

/**
 * Cria o provider factory que agrega handlers individuais em um array,
 * exposto sob um token (Symbol) próprio de cada domínio.
 */
export function createJobHandlersProvider(
  token: symbol,
  handlerClasses: Type<JobHandler>[],
): Provider {
  return {
    provide: token,
    useFactory: (...handlers: JobHandler[]) => handlers,
    inject: handlerClasses,
  };
}
