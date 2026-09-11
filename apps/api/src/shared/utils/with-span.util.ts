import {
  Attributes,
  context,
  Context,
  Link,
  Span,
  SpanKind,
  SpanStatusCode,
  trace,
  Tracer,
} from "@opentelemetry/api";

export interface WithSpanOptions {
  tracer: Tracer;
  spanName: string;
  attributes?: Attributes;
  kind?: SpanKind; // default: INTERNAL
  // Opcionais para processors BullMQ — não quebra quem não passa
  parentCtx?: Context; // contexto W3C extraído do payload do job
  links?: Link[]; // link para o trace original (jobs com delay)
  root?: boolean; // força root span (jobs com delay >= 30s)
}

export async function withSpan<T>(
  options: WithSpanOptions,
  fn: (span: Span) => Promise<T>,
): Promise<T> {
  const {
    tracer,
    spanName,
    attributes = {},
    kind = SpanKind.INTERNAL,
    parentCtx,
    links = [],
    root = false,
  } = options;

  // Se parentCtx fornecido, usa como contexto pai — senão usa o contexto ativo
  const activeCtx = parentCtx ?? context.active();

  const span = tracer.startSpan(
    spanName,
    { kind, attributes, links, root },
    activeCtx,
  );

  return context.with(trace.setSpan(activeCtx, span), async () => {
    try {
      const result = await fn(span);
      span.setStatus({ code: SpanStatusCode.OK });
      return result;
    } catch (error) {
      const err = error instanceof Error ? error : new Error(String(error));
      span.setStatus({ code: SpanStatusCode.ERROR, message: err.message });
      span.recordException(err);
      throw err;
    } finally {
      span.end();
    }
  });
}
