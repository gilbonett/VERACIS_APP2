import { Type } from "@nestjs/common";

/**
 * Registry estático central para todos os MetricsServices.
 * Populado pelo TelemetryModule no onModuleInit.
 * Consultado pelos decorators sem precisar de injeção nas classes.
 *
 * Mesmo padrão que o OTel já usa internamente com trace.getTracer()
 * e metrics.getMeter() — acesso global ao provider registrado.
 *
 * @example
 * // No decorator — sem injeção na classe
 * const metrics = TelemetryRegistry.get(CacheMetricsService);
 * metrics.recordHit("alert");
 */
export class TelemetryRegistry {
  private static readonly registry = new Map<Type<unknown>, unknown>();

  /**
   * Registra um service no registry.
   * Chamado pelo TelemetryModule no onModuleInit.
   */
  static register<T>(token: Type<T>, instance: T): void {
    TelemetryRegistry.registry.set(token, instance);
  }

  /**
   * Recupera um service do registry por tipo.
   * Type-safe — retorna o tipo correto sem cast.
   *
   * @throws se o service não foi registrado (TelemetryModule não inicializado)
   */
  static get<T>(token: Type<T>): T {
    const instance = TelemetryRegistry.registry.get(token);

    if (!instance) {
      throw new Error(
        `[TelemetryRegistry] ${token.name} não registrado. ` +
          `Verifique se o TelemetryModule foi importado no AppModule.`,
      );
    }

    return instance as T;
  }

  /**
   * Verifica se um service está registrado.
   * Útil para optional telemetry em contextos de teste.
   */
  static has<T>(token: Type<T>): boolean {
    return TelemetryRegistry.registry.has(token);
  }

  /**
   * Limpa o registry.
   * Usado apenas em testes.
   */
  static clear(): void {
    TelemetryRegistry.registry.clear();
  }
}
