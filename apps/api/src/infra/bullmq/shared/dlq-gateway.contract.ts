export interface DlqPayload<T = any> {
  originalJobName: string;
  failedReason: string;
  attemptsMade: number;
  data: T;
}

/**
 * Contrato genérico de gateway de dead-letter queue.
 * Cada domínio (Alert, Mail, ...) estende esta classe para ganhar um token
 * de injeção próprio, mantendo a mesma forma de payload e operações.
 */
export abstract class DlqGateway<T = any> {
  abstract send(payload: DlqPayload<T>): Promise<void>;
  abstract retry(jobId: string): Promise<void>;
  abstract discard(jobId: string): Promise<void>;
}
