# Relatório de Auditoria: Interceptors, Guards e Filters — VERACIS API

**Data:** 2026-07-06
**Auditor:** Staff NestJS Architect (auditoria fase 1 — somente leitura)
**Versão do branch:** `chore-memory-leak-otel`
**Nota auditoria observabilidade anterior:** ~8.5/10

---

## 1. Sumário Executivo

**Nota geral: 5.5 / 10**

**Achado mais crítico:** `console.log(reset)` em `validate-reset-token.use-case.ts` vaza dados de reset token para stdout em produção.

**Achados principais:**

- `S3ExceptionFilter` e `ProfilingInterceptor` são código morto — definidos mas nunca registrados. Erros S3 chegam ao cliente como HTTP 500 genérico em vez de 404.
- `CreateBiomeController` está marcado com `@Public()`: qualquer cliente não autenticado pode criar biomas via POST.
- `UserRole` é capturado no `SessionGuard` e passado para todos os handlers, mas não existe nenhum `RoleGuard` — o campo `currentUserRole` não é aplicado na camada HTTP.
- A ordem de registro dos `APP_INTERCEPTOR` coloca `ZodSerializerInterceptor` como camada mais externa e `TelemetryInterceptor` como interna: métricas podem registrar sucesso para requests que falham na serialização Zod.
- `ThrottlerLoggingFilter` é registrado via `app.useGlobalFilters()` sem DI, usando o `TelemetryRegistry` como workaround de IoC manual — padrão frágil.

---

## 2. Inventário Completo

| Arquivo | Tipo | Escopo | Onde registrado | Observação |
|---|---|---|---|---|
| `src/infra/throttler/global-ip-throttler.guard.ts` | Guard | Global | `APP_GUARD` em `ThrottlerModule` | Executa antes de `SessionGuard` |
| `src/infra/http/guards/session-guard.ts` | Guard | Global | `APP_GUARD` em `AuthModule` | Decorado com `@ObserveGuard` para OTEL |
| `src/infra/http/interceptors/profiling.interceptor.ts` | Interceptor | — | **NUNCA REGISTRADO** | Código morto |
| `src/infra/telemetry/telemetry-interceptor.ts` | Interceptor | Global | `APP_INTERCEPTOR` em `AppModule` (2.º) | Camada interna — ver seção 5 |
| `nestjs-zod` `ZodSerializerInterceptor` | Interceptor | Global | `APP_INTERCEPTOR` em `AppModule` (1.º) | Camada mais externa |
| `@nestjs/platform-express` `FileInterceptor` | Interceptor | Local (handler) | `@UseInterceptors` em `UploadAndCreateAttachmentController` | Upload multipart |
| `src/infra/logger/http-exception.filter.ts` | Filter | Global | `APP_FILTER` em `AppModule` | Catch-all; captura Prisma, Zod, Http |
| `src/infra/throttler/throttler-logger.filter.ts` | Filter | Global | `app.useGlobalFilters()` em `main.ts` | Sem DI; workaround TelemetryRegistry |
| `src/infra/http/filters/s3-exception.filter.ts` | Filter | — | **NUNCA REGISTRADO** | Código morto |

---

## 3. Diagrama da Ordem Real de Execução

Para uma requisição HTTP autenticada típica (ex.: `POST /alerts`):

```
1. Pino HTTP Middleware   ← customReceivedMessage; req.id gerado; session ainda não existe
         ↓
2. GlobalIpThrottlerGuard ← APP_GUARD do ThrottlerModule (importado antes do AuthModule)
   └─ Se bloqueado → ThrottlerLoggingFilter (useGlobalFilters)
         ↓
3. SessionGuard           ← APP_GUARD do AuthModule; DB lookup via ValidateSessionUseCase
   └─ Popula req.session = { sessionId, userId, currentUserRole }
   └─ Se falhar → HttpExceptionFilter (APP_FILTER) captura UnauthorizedException
         ↓
4. ZodSerializerInterceptor  ← APP_INTERCEPTOR (1.º registrado = camada mais externa)
         ↓
5. TelemetryInterceptor   ← APP_INTERCEPTOR (2.º registrado = camada interna)
   └─ Lê request.session?.userId → "anonymous" se ainda undefined (improvável aqui)
         ↓
6. ZodValidationPipe      ← APP_PIPE; ou local ZodValidationPipe como parâmetro de @Body
         ↓
7. Handler               ← Controller
         ↓
8. TelemetryInterceptor (saída) ← tap: httpMetrics.requestFinished, span OK
         ↓
9. ZodSerializerInterceptor (saída) ← serializa response DTO
         ↓
10. Pino HTTP Middleware  ← customSuccessMessage; onResFinished; customProps com userId
```

**Dependências implícitas e bugs de ordenação:**

| Problema | Detalhe |
|---|---|
| `TelemetryInterceptor` registra **sucesso** antes da serialização Zod | Se `ZodSerializerInterceptor` (etapa 9) lançar `ZodSerializationException`, o `tap` do `TelemetryInterceptor` já disparou na etapa 8 — métricas mostram HTTP 2xx para requests que retornarão 500 |
| `customProps` do Pino não vê `userId` na 1.ª chamada | Documentado no código via comentário, mas o `TelemetryInterceptor` lê `request.session?.userId` na etapa 8 — esse dado SÓ está disponível após etapa 3. Para requisições `@Public()`, o campo fica `"anonymous"` |
| Taxa de throttle ocorre antes de auth | Intencional e correto: protege o DB lookup da etapa 3 de ataques de força bruta. Mas se houver rate limiting por usuário no futuro, a ordem precisaria ser invertida |
| `ThrottlerLoggingFilter` registrado antes de `HttpExceptionFilter` | `useGlobalFilters()` tem precedência mais baixa que `APP_FILTER`, mas a especificidade de `@Catch(ThrottlerException)` garante roteamento correto. Sem bug funcional, mas arquitetura frágil |

**Pergunta central — há caso onde a ordem atual causa problema real?**

Sim. Se `ZodSerializerInterceptor` lançar `ZodSerializationException` em produção (schema de resposta incorreto no DTO), o `TelemetryInterceptor` já registrou a requisição como bem-sucedida com o `statusCode` 200 do `response` no momento do `tap`. O painel de métricas mostrará HTTP 200 para uma operação que resultou em 500 para o cliente.

---

## 4. Auditoria de Guards

### 4.1 `GlobalIpThrottlerGuard`

```typescript
// src/infra/throttler/global-ip-throttler.guard.ts
protected async getTracker(req: Record<string, any>): Promise<string> {
  return req.ips?.length ? req.ips[0] : req.ip;
}
protected generateKey(context: ExecutionContext, tracker: string, throttlerName: string): string {
  const req = context.switchToHttp().getRequest();
  req.throttlerName = throttlerName;          // side-effect: mutação do request
  return `${throttlerName}-${tracker}`;
}
```

**O que protege:** Rate limiting global por IP com 3 tiers no Redis (short: 15/10s, medium: 60/min, long: 600/30min). Configurado com blockDuration crescente.

**Escopo:** Global via `APP_GUARD`. Faz sentido — qualquer request, autenticado ou não, é limitado por IP antes do DB lookup da sessão.

**Fail-safe:** Lança `ThrottlerException`. Request é bloqueado. Correto.

**Cobertura:** `HealthController` usa `@SkipThrottle()` corretamente. Nenhum outro endpoint tem skip.

**Observações:**
- A mutação `req.throttlerName = throttlerName` serve para o `ThrottlerLoggingFilter` saber qual tier disparou. É um acoplamento implícito via request object — se o filter for executado sem o guard ter rodado, `req.throttlerName` será `undefined`.
- `throwThrottlingException` está sobrescrito mas tem comportamento idêntico ao pai — pode ser removido.
- `trust proxy = 1` em `main.ts` garante que apenas um hop (ALB) é confiável, prevenindo spoofing de IP via `X-Forwarded-For`.

### 4.2 `SessionGuard`

```typescript
// src/infra/http/guards/session-guard.ts
@ObserveGuard({ name: SessionGuard.name })
async canActivate(ctx: ExecutionContext): Promise<boolean> {
  const isPublic = this.reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
    ctx.getHandler(),
    ctx.getClass(),
  ]);
  if (isPublic) return true;

  // ...DB lookup, HMAC validation...

  req.session = { sessionId, userId, currentUserRole }; // popula context
  CookiesService.set(res, COOKIE_NAMES.SESSION_TOKEN, rawToken, { maxAge: 7 * 24 * 60 * 60 * 1000 });
  return true;
}
```

**O que protege:** Autenticação via cookie de sessão. Valida HMAC do token, faz lookup no banco via `ValidateSessionUseCase`, popula `req.session`.

**Escopo:** Global via `APP_GUARD` em `AuthModule`. Correto — default protegido, opt-out via `@Public()`.

**Fail-safe:** Lança `UnauthorizedException` se sem cookie, HMAC inválido, ou sessão inexistente. Request é bloqueado. Correto.

**Comportamento de erro inesperado:** Se `ValidateSessionUseCase` lançar erro não esperado (ex.: DB offline), a exceção propaga e é capturada por `HttpExceptionFilter` como "UnhandledException" → 500. Não há fallback que permita o request passar. **Fail-safe correto.**

**Renovação de cookie:** Toda requisição autenticada renova o cookie com `maxAge: 7 dias`. Isso implementa sessão deslizante, mas **não atualiza o registro no banco** — apenas renova o cookie no browser. Se a sessão for invalidada no banco (ex.: logout de outro dispositivo), o cookie renovado não terá efeito na próxima validação.

**Endpoints `@Public()` — lista completa:**

| Controller | Método | Path | Legítimo? |
|---|---|---|---|
| `AppController.root()` | GET | `/` | **AUSENTE** — não tem `@Public()` |
| `AppController.robots()` | GET | `/robots.txt` | Sim |
| `HealthController` | GET | `/health` | Sim |
| `SignInController` | POST | `/session/sign-in` | Sim |
| `ConfirmPasswordResetController` | POST | `/password-reset/confirm` | Sim |
| `RequestPasswordResetController` | POST | `/password-reset/request` | Sim |
| `SendOtpCodeController` | POST | `/otp/send` | Sim |
| `ValidateResetTokenController` | POST | `/password-reset/validate` | Sim |
| `VerifyOtpController` | POST | `/otp/verify` | Sim |
| `RegisterUserController` | POST | `/users` | Sim |
| `GetBiomesController` | GET | `/biomes` | Sim (dados de referência) |
| `CreateBiomeController` | POST | `/biomes` | **SUSPEITO** — mutação sem auth |
| `GetCommunitiesController` | GET | `/communities` | Aceitável (dados públicos) |
| `GetFilesController` | GET | `/files/:fileName` | Risco de privacidade (ver seção 8) |

**Problema de sign-out:** `SignOutController` não tem `@Public()`. Se a sessão expirar server-side antes do logout, o usuário recebe 401 ao tentar sair. O cookie permanece no browser. Menor UX issue, mas relevante em mobile.

**Ausência de RBAC:** O `SessionGuard` captura `currentUserRole` (`MEMBER` | `LEADER` | `MANAGER` | `ROOT`) e o popula em `req.session`. No entanto, **não existe nenhum `RoleGuard` ou decorator de roles** na codebase. Endpoints como `POST /biomes` deveriam ser restritos a `MANAGER`/`ROOT`, mas não há enforcement na camada HTTP — a lógica de roles, quando existe, está enterrada nos Use Cases.

---

## 5. Auditoria de Interceptors

### 5.1 `ZodSerializerInterceptor` (nestjs-zod)

**Responsabilidade:** Serialização de responses usando schemas Zod dos DTOs de resposta.

**Escopo:** Global, 1.º `APP_INTERCEPTOR` em `AppModule` → camada mais externa.

**Tratamento de erro:** Lança `ZodSerializationException` quando o response não satisfaz o schema. Capturado por `HttpExceptionFilter` que retorna HTTP 500.

**Problema de ordenação (P2):** Por ser a camada mais externa, seus erros de serialização ocorrem DEPOIS que `TelemetryInterceptor` já finalizou a medição. Métricas de duração não incluem o overhead de serialização Zod.

### 5.2 `TelemetryInterceptor`

```typescript
// src/infra/telemetry/telemetry-interceptor.ts
const route = request.routerPath ?? request.url;  // ← fallback problemático
// ...
return next.handle().pipe(
  tap(() => {
    const statusCode = response.statusCode;       // ← statusCode ANTES da serialização
    span?.setAttribute(HTTP_ATTRS.USER_ID, request.session?.userId ?? "anonymous");
    this.httpMetrics.requestFinished({ route, method, statusCode }, durationS);
  }),
  catchError((error) => { /* ... */ throw error; }),
);
```

**Responsabilidade:** Métricas HTTP (duração, status, rota), atributos OTEL no span, integração com Pyroscope via `wrapWithLabels`.

**Problemas identificados:**

1. **`request.routerPath ?? request.url` — fallback de alta cardinalidade:** `routerPath` é a rota parametrizada (ex.: `/alerts/:id`). Se for `undefined`, cai para `request.url` com o ID real (ex.: `/alerts/123-456`), criando uma label de métrica única por requisição. Isso não é problema para rotas não-encontradas (interceptor não roda), mas pode ocorrer em edge cases onde a rota é resolvida sem `routerPath` estar populado.

2. **`statusCode` capturado antes da serialização Zod:** Para `ZodSerializationException`, o `tap` fires com `statusCode = 200` (o handler retornou com sucesso), mas o response final é 500. As métricas mostram HTTP 200 para uma falha real.

3. **`userId` sempre "anonymous" para `@Public()` requests:** Correto e esperado, mas o valor literal `"anonymous"` cria cardinalidade no span attribute `user.id`. Usar string vazia ou omitir o atributo seria mais limpo.

**Responsabilidade única?** Não completamente: combina OTEL spans, métricas Prometheus, e Pyroscope labels. Cada preocupação é small, mas são 3 sistemas distintos. Aceitável para um interceptor de observabilidade.

**Estado esperado:** Necessita que o span OTEL já esteja ativo (criado pelo SDK auto-instrumentado do Express/HTTP). Correto — o SDK de OTEL instrumenta o Express antes do NestJS bootstrap.

### 5.3 `ProfilingInterceptor` — CÓDIGO MORTO

```typescript
// src/infra/http/interceptors/profiling.interceptor.ts
@Injectable()
export class ProfilingInterceptor implements NestInterceptor {
  constructor(private readonly env: EnvService) {}
  // wraps requests com Pyroscope.wrapWithLabels usando method/route como labels
}
```

**NUNCA registrado.** Não aparece em nenhum `providers[]`, `APP_INTERCEPTOR`, nem `@UseInterceptors`. O `TelemetryInterceptor` já usa `wrapWithLabels` do `profiling.ts` diretamente. `ProfilingInterceptor` é duplicação obsoleta e deve ser removido.

---

## 6. Auditoria de Exception Filters

### 6.1 `ThrottlerLoggingFilter`

```typescript
// src/infra/throttler/throttler-logger.filter.ts
@Catch(ThrottlerException)
export class ThrottlerLoggingFilter implements ExceptionFilter {
  private readonly logger = new Logger("RateLimit");

  catch(_: ThrottlerException, host: ArgumentsHost) {
    // ...
    span?.setStatus({ code: SpanStatusCode.ERROR, message: "rate_limited" }); // ← P2
    this.logger.warn("blocked_by_rate_limit", { ... traceId ... });

    if (TelemetryRegistry.has(RateLimitMetricsService)) {  // ← workaround DI
      const metrics = TelemetryRegistry.get(RateLimitMetricsService);
      metrics.recordThrottled({ throttlerName, route });
    }
    res.status(429).json({ statusCode: 429, message: "Too many requests", ... });
  }
}
```

**Que tipos captura:** `ThrottlerException` especificamente. Correto — não interfere com outras exceções.

**Problema de registro (P2):** Registrado via `app.useGlobalFilters(new ThrottlerLoggingFilter())` em `main.ts` sem injeção de dependência. O workaround com `TelemetryRegistry.has()` é frágil: se `TelemetryModule` não concluiu `onModuleInit` antes da primeira requisição throttled, as métricas não são registradas silenciosamente.

**`SpanStatusCode.ERROR` para 429 (P2):** Uma resposta 429 é comportamento esperado do sistema (rate limiting funcionando corretamente), não um erro de aplicação. Marcar o span como ERROR inflaciona a taxa de erro no Grafana, mascarando erros reais. O correto seria manter o span como OK e adicionar um atributo `rate_limit.blocked = true` (que já é feito) sem alterar o `SpanStatus`.

**Logging:** `traceId` presente no log. `userId` ausente — para requisições autenticadas que forem throttled, não é possível correlacionar com o usuário (embora `client.address` + rate limit por IP seja suficiente).

**Resposta ao cliente:** Formato consistente com `HttpExceptionFilter`.

### 6.2 `HttpExceptionFilter`

```typescript
// src/infra/logger/http-exception.filter.ts
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(HttpExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const requestId = request.id ?? request.headers["x-request-id"];
    const span = trace.getActiveSpan();
    span?.setAttribute(HTTP_ATTRS.REQUEST_ID, requestId as string);  // OTEL

    if (exception instanceof ZodSerializationException) { ... }     // → 500
    if (exception instanceof PrismaClientKnownRequestError) { ... } // → 409/400/404
    if (exception instanceof HttpException) { ... }                  // → status do erro
    // fallback genérico → 500
  }
}
```

**Que tipos captura:** `@Catch()` — todos. Captura em camadas: Zod, Prisma, HttpException, e genérico.

**Mapeamento Prisma:** Apenas P2002 (conflict), P2003 (foreign key), P2025 (not found). Códigos como P2000 (value too long), P2011 (null constraint), P2012 (missing required value), P2014 (relation violation) etc. caem para o fallback 500 sem mensagem descritiva. Esses erros são logados com `meta` e `code`, mas o cliente recebe "Internal server error" sem contexto útil.

**Vazamento de informação:** Nenhum. Stack traces e detalhes Prisma aparecem apenas nos logs, nunca no response body. Correto.

**Logging por status:** `logByStatus` aplica `error` para 5xx e `warn` para 4xx. Exceção: "Cannot GET/POST..." 404s de rotas inexistentes são silenciados (retorno antecipado). **Boa prática** — evita ruído de scanners.

**`requestId`:** Propagado para o span OTEL e para o response body. Correto.

**Inconsistência de log level para 401/403:** Ambos são logados como `warn` via `logByStatus`, o que é correto. Porém, `ObserveGuard` loga o erro do `SessionGuard` com `logger.error(...)` (linha 65 do decorator) quando o guard lança `UnauthorizedException`. Uma tentativa de acesso sem autenticação dispara um `error` level no `ObserveGuard` e um `warn` level no `HttpExceptionFilter`. Duplo log + nível incorreto no guard.

### 6.3 `S3ExceptionFilter` — CÓDIGO MORTO

```typescript
// src/infra/http/filters/s3-exception.filter.ts
@Catch()
export class S3ExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(S3ExceptionFilter.name);

  catch(exception: Record<string, string>, host: ArgumentsHost) {
    if (exception.name === "NoSuchKey" || ...) { return response.status(404) }
    if (exception.name === "AccessDenied" || ...) { return response.status(403) }
    return response.status(500)
  }
}
```

**NUNCA registrado.** O `GetFilesController` (que baixa arquivos do S3) não usa `@UseFilters(S3ExceptionFilter)`, nem o filter está registrado globalmente. Consequência: se o S3 retornar `NoSuchKey`, a exceção não é um `HttpException`, portanto cai no fallback genérico do `HttpExceptionFilter` como "UnhandledException" → HTTP 500.

**Problema adicional:** O filter usa `@Catch()` mas tipagem `exception: Record<string, string>`. Se registrado globalmente, interceptaria TODAS as exceções antes de verificar se são erros S3, retornando 500 para qualquer exceção que não seja NoSuchKey/AccessDenied — incluindo `HttpException` legítimas. Deve ser registrado LOCALMENTE no controller via `@UseFilters(S3ExceptionFilter)`.

---

## 7. Auditoria de Logger

### Uso de `console.log` / `console.error`

```
main.ts:73         console.error("Error during shutdown", err)
                   → Pino logger já disponível aqui (app.get(Logger)). Use logger.error().

profiling.ts:34    console.error("[Pyroscope] Failed to start profiling", err)
                   → Aceitável: ocorre antes do bootstrap do NestJS.

instrumentation.ts:52,193  console.warn / console.log
                   → Aceitável: inicialização do OTEL SDK antes do NestJS.

domain/auth/use-cases/validate-reset-token.use-case.ts:33
                   console.log(reset)  ← CRÍTICO: debug statement em produção
                   → `reset` contém dados do PasswordReset, incluindo o hash do token.
                   → Qualquer agregador de logs (Loki, CloudWatch) indexará esse dado.
```

### `new Logger()` vs Pino injetado

Todo o código usa `new Logger(ClassName)` do `@nestjs/common`. Isso é aceitável porque `app.useLogger(pinoLogger)` em `main.ts` configura o logger global, e `Logger` do NestJS delega para o app logger de forma estática. O `mixin` do pino-http injeta `trace_id`/`span_id` via `trace.getActiveSpan()` em todos os logs, incluindo os do `new Logger()`.

**O que FALTA nos logs de `new Logger()` em filters/interceptors:**
- `userId`: presente apenas via `customProps` do pino-http, que é request-scoped. Logs emitidos por `HttpExceptionFilter` ou `ThrottlerLoggingFilter` usando `new Logger()` NÃO incluem `userId` no payload — apenas `requestId`.
- Para correlacionar erros com usuários via Loki, é necessário fazer join por `requestId`.

### `ObserveGuard` loga `UnauthorizedException` como `error`

```typescript
// src/infra/telemetry/decorators/observe-guard.decorator.ts:65
logger.error(`✗ ${spanName}`, { error: error.message, traceId: ... });
```

Qualquer `UnauthorizedException` (401) ou `ForbiddenException` (403) lançada pelo `SessionGuard` é logada como `error` pelo `ObserveGuard`. Isso é semanticamente incorreto — 401/403 são comportamentos esperados do sistema, não erros. Nível correto: `warn`.

### Níveis de log por componente

| Componente | Evento | Nível atual | Correto? |
|---|---|---|---|
| `HttpExceptionFilter` | HTTP 4xx | warn | Sim |
| `HttpExceptionFilter` | HTTP 5xx | error | Sim |
| `HttpExceptionFilter` | Rota não encontrada (404 scanner) | silencioso | Sim |
| `ThrottlerLoggingFilter` | 429 throttled | warn | Sim |
| `ObserveGuard` | 401/403 do SessionGuard | **error** | **Não — deveria ser warn** |
| `S3ExceptionFilter` | NoSuchKey (404) | warn | Correto (mas nunca executa) |
| `S3ExceptionFilter` | AccessDenied (403) | **error** | **Deveria ser warn** |

---

## 8. Gaps — O Que Falta

### Cross-cutting concerns ausentes

| Gap | Impacto |
|---|---|
| **Timeout global interceptor** | Queries lentas ou chamadas S3 penduram a request indefinidamente. Um `TimeoutInterceptor` com `throwError(new RequestTimeoutException())` após X segundos é padrão NestJS |
| **Role Guard / RBAC** | `UserRole` é capturado mas nunca aplicado na camada HTTP. Criar biomas ou executar ações administrativas não verifica roles. A lógica de autorização existe em alguns Use Cases mas não é garantida pelo pipeline |
| **Response transform interceptor global** | Sem envelope de resposta padronizado. Alguns handlers retornam `{id}`, outros retornam o objeto completo, outros usam Presenters. `ZodSerializerInterceptor` normaliza serialização mas não envelope |
| **Versioning** | Nenhum versionamento de API (`/v1/`, header `api-version`, etc.). Mudanças breaking afetarão todos os clientes |
| **Correlation ID propagado a downstream** | `requestId` é gerado e propagado no span, mas não injetado como header em chamadas a serviços downstream (S3, Prisma, Redis). Rastreabilidade end-to-end parcial |

### Componentes incompletos

| Componente | Problema |
|---|---|
| `ProfilingInterceptor` | Definido, nunca registrado. Deve ser removido ou integrado ao `TelemetryModule` |
| `S3ExceptionFilter` | Definido, nunca aplicado. `GetFilesController` precisa de `@UseFilters(S3ExceptionFilter)` |
| `ObserveGuard` (decorator) | Loga como `error` para exceções que deveriam ser `warn` |
| `GlobalIpThrottlerGuard.throwThrottlingException` | Override sem mudança de comportamento — dead code |

### Inconsistências entre controllers

| Inconsistência | Detalhe |
|---|---|
| **Dois `ZodValidationPipe`** | `nestjs-zod`'s pipe registrado globalmente E `src/infra/http/pipes/zod-validation-pipe.ts` usado como parâmetro em ~10 controllers. Formatos de erro distintos: o local retorna `{errors: fromZodError(...)}`, o global retorna o formato nestjs-zod |
| **Mapeamento do Either disperso** | Cada controller chama `result.isLeft()` e decide qual `HttpException` lançar. `GetProfileController` usa `throw new Error(...)` (não um `HttpException`) para erro de domínio — cai como 500 em vez do status semântico correto |
| **`@Public()` em mutation `createBiome`** | Inconsistente com todos os outros endpoints de escrita que requerem auth |
| **`AppController.root()` sem `@Public()`** | O endpoint `GET /` retorna informações da API mas requer autenticação — improvável que intencional |

---

## 9. Tabela de Recomendações Priorizadas

| Prioridade | Achado | Componente | Esforço | Recomendação |
|---|---|---|---|---|
| **P1** | `console.log(reset)` vaza hash de reset token para logs | `validate-reset-token.use-case.ts:33` | S | Remover o `console.log` imediatamente |
| **P1** | `CreateBiomeController` é `@Public()` — POST sem auth | `create-biome.controller.ts` | S | Remover `@Public()`, adicionar `@Roles('MANAGER', 'ROOT')` quando `RoleGuard` existir |
| **P1** | `S3ExceptionFilter` nunca registrado — erros S3 viram HTTP 500 | `get-files.controller.ts` | S | Adicionar `@UseFilters(S3ExceptionFilter)` no `GetFilesController`; alterar `@Catch()` para `@Catch(/* S3 error types */)` |
| **P1** | Ausência de RBAC na camada HTTP | Codebase inteiro | L | Criar `RoleGuard` + decorator `@Roles(...)` usando `req.session.currentUserRole`; aplicar em endpoints administrativos |
| **P2** | `AppController.root()` sem `@Public()` — GET `/` requer auth | `app.controller.ts` | S | Adicionar `@Public()` ao handler `root()` |
| **P2** | `ThrottlerLoggingFilter` sem DI (`useGlobalFilters`) | `main.ts`, `throttler-logger.filter.ts` | M | Registrar via `APP_FILTER` no `ThrottlerModule`; eliminar dependência do `TelemetryRegistry` |
| **P2** | `SpanStatusCode.ERROR` para 429 infla taxa de erro | `throttler-logger.filter.ts` | S | Remover `span.setStatus(ERROR)`; manter os atributos `rate_limit.*` |
| **P2** | `TelemetryInterceptor` registra sucesso antes da serialização Zod | `app.module.ts` | S | Inverter ordem: registrar `TelemetryInterceptor` ANTES de `ZodSerializerInterceptor` no `providers[]` para que Telemetry seja a camada mais externa |
| **P2** | `ObserveGuard` loga `UnauthorizedException` como `error` | `observe-guard.decorator.ts:65` | S | Adicionar verificação: se `err instanceof UnauthorizedException \|\| err instanceof ForbiddenException`, usar `logger.warn` |
| **P2** | `GetProfileController` lança `new Error()` para erro de domínio → HTTP 500 | `get-profile.controller.ts:22` | S | Trocar `throw new Error(...)` por `throw new NotFoundException(...)` ou equivalente semântico |
| **P2** | `console.error` no shutdown handler usa `console` em vez de Pino | `main.ts:73` | S | Usar a referência `logger` já disponível no escopo do closure |
| **P2** | Ausência de timeout global para requests | Codebase | M | Adicionar `TimeoutInterceptor` global com `rxjs/operators timeout` + `throwError(new RequestTimeoutException())` |
| **P2** | Sign-out requer sessão válida — UX para sessões expiradas | `sign-out.controller.ts` | M | Adicionar `@Public()` ao sign-out; implementar logout mesmo sem sessão válida (apenas limpar cookie) |
| **P3** | `ProfilingInterceptor` é código morto | `profiling.interceptor.ts` | S | Remover o arquivo |
| **P3** | Dois `ZodValidationPipe` com formatos de erro distintos | Controllers de auth + global | M | Migrar todos os controllers para o `ZodValidationPipe` do `nestjs-zod` via DTO classes com `createZodDto`; remover a implementação local |
| **P3** | Mapeamento do Either pattern disperso por todos os controllers | 20+ controllers | L | Criar `DomainExceptionFilter` ou helper `mapDomainErrorToHttpException(error: DomainError): HttpException` reutilizável |
| **P3** | `GlobalIpThrottlerGuard.throwThrottlingException` override vazio | `global-ip-throttler.guard.ts` | S | Remover o override — comportamento idêntico ao pai |
| **P3** | `request.routerPath ?? request.url` em `TelemetryInterceptor` | `telemetry-interceptor.ts` | S | Usar `request.route?.path ?? request.routerPath ?? "unknown"` para maior precisão; nunca usar `request.url` como fallback de label de métrica |
| **P3** | `userId` ausente em logs de filters/interceptors | Todos os `new Logger()` em filters | M | Extrair `userId` de `request.session?.userId` nos logs de exception filters; adicionar ao payload de log do `HttpExceptionFilter` |
| **P3** | `S3ExceptionFilter.AccessDenied` logado como `error` | `s3-exception.filter.ts` | S | Alterar para `warn` — AccessDenied é um 403, não um erro de aplicação |

---

*Auditoria fase 1 concluída. Nenhum arquivo de código foi modificado.*
