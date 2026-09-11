/**
 * Tipos de token JWT usados no sistema.
 *
 * AUTH           → Access token final (15min). Autoriza rotas protegidas.
 * STEP_EMAIL     → Token de fluxo: credenciais validadas, aguardando confirmação de e-mail (5min).
 * STEP_CODE      → Token de fluxo: e-mail confirmado, aguardando código OTP (10min).
 * RESET_PASSWORD → Token de fluxo: autoriza redefinição de senha (15min).
 */
export type TokenType = "AUTH" | "STEP_EMAIL" | "STEP_CODE" | "RESET_PASSWORD";

/**
 * Payload padrão dos JWTs emitidos pelo sistema.
 *
 * Campos obrigatórios:
 *   sub       → UUID do usuário dono do token.
 *   type      → Tipo do token; usado para validar que o token está sendo
 *               usado na etapa correta do fluxo.
 *   jti       → JWT ID único (UUID v4). Permite revogação pontual de tokens
 *               via blacklist no Redis sem invalidar toda a sessão.
 *
 * Campos opcionais:
 *   sessionId → ID da sessão persistida no banco (Session.id). Presente
 *               apenas em tokens do tipo AUTH, conectando o JWT à sessão
 *               correspondente para auditoria e revogação.
 *   iat       → Issued At: timestamp Unix (segundos) de emissão. Preenchido
 *               automaticamente pelo JwtService ao assinar.
 *   exp       → Expiration: timestamp Unix (segundos) de expiração. Preenchido
 *               automaticamente pelo JwtService via `expiresIn`.
 */
export interface JwtPayload {
  /** UUID do usuário proprietário do token */
  sub: string;

  /** Tipo do token — restringe o uso a uma etapa específica do fluxo */
  type: TokenType;

  /**
   * JWT ID único (UUID v4).
   * Usado para invalidação pontual via blacklist no Redis.
   * Deve ser gerado com `crypto.randomUUID()` antes de cada `encrypter.encrypt()`.
   */
  jti: string;

  /**
   * ID da Session persistida (presente apenas em tokens AUTH).
   * Permite revogar o access token sem aguardar expiração natural.
   */
  sessionId?: string;

  /** Issued At — timestamp Unix em segundos (preenchido automaticamente pelo JwtService) */
  iat?: number;

  /** Expiration — timestamp Unix em segundos (preenchido automaticamente pelo JwtService) */
  exp?: number;
}

/**
 * Payload de um token AUTH já validado pelo JwtStrategy.
 * Todos os campos obrigatórios estão presentes e verificados.
 */
export type AuthPayload = Required<Omit<JwtPayload, "sessionId">> & {
  type: "AUTH";
  sessionId: string;
};

/**
 * Payload de um step token já validado (STEP_EMAIL | STEP_CODE | RESET_PASSWORD).
 * Não possui sessionId pois ainda não há sessão persistida.
 */
export type StepPayload = Required<Omit<JwtPayload, "sessionId">> & {
  type: Exclude<TokenType, "AUTH">;
};
