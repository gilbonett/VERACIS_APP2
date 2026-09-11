import { TRACER_NAMES } from "@/shared/constants/telemetry.constants";
import { SpanKind } from "@opentelemetry/api";

type TracerName = (typeof TRACER_NAMES)[keyof typeof TRACER_NAMES];

export interface SpanConfig {
  /** TRACER_NAMES.CACHE | TRACER_NAMES.BUSINESS | etc */
  tracer: TracerName;
  /** Nome do span */
  name: string;
  /** Default: SpanKind.INTERNAL */
  kind?: SpanKind;
  /** Atributos fixos setados no início do span */
  attributes?: Record<string, string | number | boolean>;
  /**
   * Se o método decorado retorna Promise. Default: true.
   * Use false para métodos síncronos (ex: HMAC, geração de token) —
   * evita forçar Promise no retorno e quebrar a assinatura da interface.
   */
  async?: boolean;
}

export interface MetricConfig {
  /** TRACER_NAMES.CACHE | TRACER_NAMES.BUSINESS | etc */
  meter: TracerName;
  /** Nome do histograma de duração */
  duration: string;
  /** Nome do counter de chamadas — opcional */
  count?: string;
  /** Nome do counter de erros — opcional */
  errors?: string;
  /** Labels fixos para todas as métricas */
  labels: Record<string, string | number | boolean>;
  /** Buckets do histograma */
  buckets: number[];
}

export interface ObserveConfig {
  span: SpanConfig;
  metric: MetricConfig;
}
