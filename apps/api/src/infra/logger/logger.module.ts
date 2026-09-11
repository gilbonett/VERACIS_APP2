import { Module } from "@nestjs/common";
import { trace } from "@opentelemetry/api";
import { LoggerModule as PinoLoggerModule } from "nestjs-pino";
import { randomUUID } from "node:crypto";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";

const SENSITIVE_FIELD_NAMES = [
  "password",
  "token",
  "secret",
  "cpf",
  "cnpj",
  "cardNumber",
  "cvv",
  "authorization",
  "otp",
  "code", // POST /session/otp/verify manda o código de 6 dígitos em `code`
];

function redactSensitiveFields(
  obj: Record<string, unknown> | undefined,
): Record<string, unknown> | undefined {
  if (!obj || typeof obj !== "object") return obj;
  const clone: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj)) {
    const isSensitive = SENSITIVE_FIELD_NAMES.some((field) =>
      key.toLowerCase().includes(field.toLowerCase()),
    );
    clone[key] = isSensitive ? "[REDACTED]" : value;
  }
  return clone;
}

@Module({
  imports: [
    PinoLoggerModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useFactory(env: EnvService) {
        const NODE_ENV = env.get("NODE_ENV");
        const LOG_LEVEL = env.get("LOG_LEVEL");
        const SERVICE_NAME = env.get("OTEL_SERVICE_NAME");
        const SERVICE_VERSION = env.get("APP_VERSION") ?? "unknown";
        const isDevelopment = NODE_ENV === "development";

        return {
          pinoHttp: {
            // --- Identificação e correlação ---
            genReqId: (req) =>
              (req.headers["x-request-id"] as string) ?? randomUUID(),

            level: LOG_LEVEL,

            // Campos fixos em TODO log emitido pelo processo —
            // úteis para filtrar por serviço/versão/ambiente sem
            // depender só das labels do ECS/OTel.
            base: {
              service: SERVICE_NAME,
              service_version: SERVICE_VERSION,
              env: NODE_ENV,
              pid: process.pid,
            },

            // trace_id/span_id em todo log — correlação direta com
            // o Tempo, mesmo em logs que não vêm do pino-http
            // (ex: logger.log() dentro de um service qualquer).
            mixin(_context, _level) {
              const span = trace.getActiveSpan();
              if (!span) return {};
              const { traceId, spanId, traceFlags } = span.spanContext();
              return {
                trace_id: traceId,
                span_id: spanId,
                trace_flags: traceFlags,
              };
            },

            // --- Redação de dados sensíveis ---
            redact: {
              paths: [
                "req.headers.authorization",
                "req.headers.cookie",
                "res.headers['set-cookie']",
                "req.body.password",
                "req.body.token",
                "req.body.secret",
                "req.body.cpf",
                "req.body.cnpj",
                "req.body.cardNumber",
                "req.body.cvv",
                "req.body.otp",
                "req.body.code",
                "req.query.token",
              ],
              remove: true,
            },

            // --- Serializers: o que entra no log de cada objeto ---
            serializers: {
              req(req) {
                return {
                  id: req.id,
                  method: req.method,
                  url: req.url,
                  // path sem querystring, útil para agrupar por
                  // rota independente dos parâmetros usados
                  path: req.url?.split("?")[0],
                  query: redactSensitiveFields(
                    req.query as Record<string, unknown>,
                  ),
                  userAgent: req.headers["user-agent"],
                  "client.address": req.ips?.length ? req.ips[0] : req.ip,
                  origin: req.headers["origin"],
                  referer: req.headers["referer"],
                  contentType: req.headers["content-type"],
                  contentLength: req.headers["content-length"],
                };
              },
              res(res) {
                return {
                  statusCode: res.statusCode,
                  contentLength: res.getHeader?.("content-length"),
                };
              },
              // Erros completos: stack, causa, código — essencial
              // para debug em produção sem precisar reproduzir local.
              err(err: Error & { code?: string; statusCode?: number }) {
                return {
                  type: err.constructor?.name ?? "Error",
                  message: err.message,
                  stack: err.stack,
                  code: err.code,
                  statusCode: err.statusCode,
                };
              },
            },

            // --- Propriedades customizadas por requisição ---
            // ATENÇÃO: pino-http tem um bug conhecido (issues #216,
            // #197 no repo pinojs/pino-http) onde customProps é
            // chamado DUAS VEZES por requisição (uma no middleware de
            // entrada, outra em onResFinished), e os retornos são
            // mesclados via child logger em vez de sobrescritos —
            // qualquer chave com valor objeto duplica no JSON final
            // ("body":{...},"body":{...}), que parsers mais estritos
            // (caso do Loki) rejeitam como malformado.
            //
            // Mitigação: marcamos req com uma flag não-enumerável na
            // primeira chamada; a segunda chamada detecta a flag e
            // retorna objeto vazio, eliminando a duplicação na raiz.
            // --- Propriedades customizadas por requisição ---
            // ATENÇÃO: pino-http chama customProps DUAS VEZES por
            // requisição (issues #216/#197 do pinojs/pino-http) — uma
            // vez no middleware de ENTRADA (antes de qualquer Guard
            // rodar, então req.session ainda não existe) e outra em
            // onResFinished (depois do Guard já ter populado a sessão).
            //
            // Isso significa que SÓ a segunda chamada tem acesso real
            // a req.session.userId — a primeira sempre vê undefined.
            // Por isso a flag de "já processado" só pode ser marcada
            // quando o userId for capturado de fato, nunca antes;
            // caso contrário a 1ª chamada (sem dados) consome a única
            // chance e a 2ª (com dados) não retorna mais nada.
            customProps: (req) => {
              const typedReq = req as unknown as {
                session?: { userId?: string; currentUserRole?: string };
                body?: Record<string, unknown>;
                __customPropsUserLogged?: boolean;
                __customPropsBodyLogged?: boolean;
              };

              const session = typedReq.session;
              const body = typedReq.body;
              const hasBody = body && Object.keys(body).length > 0;

              const result: Record<string, unknown> = {};

              // só inclui userId se ainda não foi capturado nesta
              // requisição E se a sessão já existe nesta chamada
              if (session?.userId && !typedReq.__customPropsUserLogged) {
                typedReq.__customPropsUserLogged = true;
                result.userId = session.userId;
                result.currentUserRole = session.currentUserRole;
              }

              // mesma lógica para o body — evita duplicação sem
              // depender de uma única flag compartilhada que pode
              // disparar antes dos dados existirem
              if (hasBody && !typedReq.__customPropsBodyLogged) {
                typedReq.__customPropsBodyLogged = true;
                result.body = JSON.stringify(redactSensitiveFields(body));
              }

              return result;
            },

            // --- Mensagens legíveis por evento ---
            customReceivedMessage: (req) =>
              `Incoming → ${req.method} ${req.url}`,
            customSuccessMessage: (req, res) =>
              `Completed ← ${req.method} ${req.url} ${res.statusCode}`,
            customErrorMessage: (req, res, error) =>
              `Error ✗ ${req.method} ${req.url} ${res.statusCode} — ${error.message}`,

            // --- Nível de log dinâmico por status code ---
            // 5xx → error (alarme real), 4xx → warn (esperado, mas
            // vale atenção), resto → info. Facilita alertas no
            // Grafana sem precisar parsear o statusCode manualmente.
            customLogLevel: (_req, res, err) => {
              if (res.statusCode >= 500 || err) return "error";
              if (res.statusCode >= 400) return "warn";
              if (res.statusCode >= 300) return "silent";
              return "info";
            },

            // --- Performance: tempo de resposta sempre presente ---
            customAttributeKeys: {
              responseTime: "duration_ms",
            },

            autoLogging: {
              ignore: (req) => {
                const url = req.url ?? "";

                if (url.startsWith("/health")) {
                  return true;
                }

                // Heurística para varreduras automatizadas de bot/scanner
                // (paths que nunca existirão na nossa aplicação: shells
                // PHP, configs sensíveis, paths de WordPress/CMS, etc).
                // O `ignore` do pino-http roda antes da rota ser
                // resolvida, então não sabemos ainda se vai dar 404 —
                // por isso filtramos por padrão de path, não por status.
                // Cobertura limitada: novos padrões de bot não listados
                // aqui ainda serão logados. Para bloqueio mais robusto
                // e abrangente, use uma regra de WAF no Load Balancer.
                const isLikelyBotScan =
                  /\.(php|php[3-8]?|asp|aspx|jsp|cgi|env|git|aws|sql|bak)$/i.test(
                    url,
                  ) ||
                  /^\/(wp-admin|wp-content|wp-includes|wp-login|xmlrpc\.php|phpmyadmin|\.git|\.aws|\.env)/i.test(
                    url,
                  ) ||
                  url === "/favicon.ico" ||
                  url === "/favicon.icon";

                return isLikelyBotScan;
              },
            },

            transport: isDevelopment
              ? {
                  target: "pino-pretty",
                  options: {
                    singleLine: true,
                    colorize: true,
                    translateTime: "HH:MM:ss.l",
                    ignore: "pid,hostname",
                  },
                }
              : undefined,
          },
        };
      },
    }),
  ],
})
export class LoggerModule {}
