import { Span, trace } from "@opentelemetry/api";

/**
 * Param decorator que injeta o span ativo como argumento do método.
 * Padrão nestjs-otel — acesso manual ao span para setar atributos específicos.
 *
 * Funciona com ou sem @ObserveSpan:
 * - Com @ObserveSpan: injeta o span aberto pelo decorator
 * - Sem @ObserveSpan: injeta o span ativo do contexto pai (ex: request)
 *
 * @example
 * // Acesso ao span do request atual
 * async execute(dto: CreateAlertDto, @CurrentSpan() span?: Span) {
 *   span?.setAttribute("alert.category", dto.categoryId);
 * }
 *
 * // Combinado com @ObserveSpan
 * @ObserveSpan({ tracer: TRACER_NAMES.CACHE, name: "cache.get", kind: SpanKind.CLIENT })
 * async findById(id: string, @CurrentSpan() span?: Span) {
 *   span?.setAttribute("alert.id", id);
 *   return this.redis.get(`alert:${id}`);
 * }
 */
export function CurrentSpan(): ParameterDecorator {
  return (target, propertyKey, parameterIndex) => {
    const existingIndexes: number[] =
      Reflect.getMetadata(
        "current_span:params",
        target,
        propertyKey as string,
      ) ?? [];

    existingIndexes.push(parameterIndex);

    Reflect.defineMetadata(
      "current_span:params",
      existingIndexes,
      target,
      propertyKey as string,
    );
  };
}

/**
 * Aplica a injeção do span nos args do método.
 * Chamado internamente pelo @ObserveSpan e pode ser usado em qualquer
 * decorator de método que precise suportar @CurrentSpan.
 */
export function injectCurrentSpan(
  target: object,
  propertyKey: string,
  args: unknown[],
  span?: Span,
): unknown[] {
  const indexes: number[] | undefined = Reflect.getMetadata(
    "current_span:params",
    target,
    propertyKey,
  );

  if (!indexes || indexes.length === 0) return args;

  const activeSpan = span ?? trace.getActiveSpan();
  const newArgs = [...args];

  for (const index of indexes) {
    newArgs[index] = activeSpan;
  }

  return newArgs;
}
