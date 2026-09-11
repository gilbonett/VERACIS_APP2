import { Job } from "bullmq";

/**
 * Contrato que todo handler de job deve implementar.
 *
 * É uma abstract class (não uma interface) de propósito: precisa existir em
 * runtime para servir como token de injeção de dependência do NestJS -
 * interfaces são apagadas na compilação e não funcionam como token.
 */
export abstract class JobHandler<T = unknown> {
  abstract readonly jobName: string;
  abstract handle(job: Job<T>): Promise<void>;
}
