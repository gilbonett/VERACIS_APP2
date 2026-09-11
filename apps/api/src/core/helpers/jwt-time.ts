/**
 * Durações canônicas dos tokens JWT do sistema.
 *
 * Estas constantes são a única fonte de verdade para os tempos de expiração.
 * Use-as sempre que precisar configurar `maxAge` em cookies, `expiresIn` em
 * JWTs ou `TokenExpiration.fromX()` em entidades de domínio.
 *
 * IMPORTANTE — unidades por uso:
 *   `_MS`       → cookies Express (res.cookie maxAge espera milissegundos)
 *   `_SECONDS`  → kept apenas para compatibilidade interna de cálculo
 *   `_EXPIRES_IN` → JwtService (string "15m", "30d", etc.)
 */

// ─── Access Token (JWT curto) ────────────────────────────────────────────────

/** Duração do access token JWT em minutos */
export const ACCESS_TOKEN_DURATION_MINUTES = 15;

/** Duração do access token JWT em segundos (uso interno) */
export const ACCESS_TOKEN_DURATION_SECONDS = ACCESS_TOKEN_DURATION_MINUTES * 60;

/** Duração do access token JWT em milissegundos — usar em cookies */
export const ACCESS_TOKEN_DURATION_MS = ACCESS_TOKEN_DURATION_SECONDS * 1000;

/** String de expiração aceita pelo JwtService (`expiresIn`) */
export const ACCESS_TOKEN_EXPIRES_IN =
  `${ACCESS_TOKEN_DURATION_MINUTES}m` as const;

// ─── Refresh Token (sessão persistida no banco) ───────────────────────────────

/** Duração do refresh token em dias */
export const REFRESH_TOKEN_DURATION_DAYS = 30;

/** Duração do refresh token em segundos (uso interno) */
export const REFRESH_TOKEN_DURATION_SECONDS =
  REFRESH_TOKEN_DURATION_DAYS * 24 * 60 * 60;

/** Duração do refresh token em milissegundos — usar em cookies */
export const REFRESH_TOKEN_DURATION_MS = REFRESH_TOKEN_DURATION_SECONDS * 1000;

// ─── Step Tokens (fluxo MFA / multi-step) ────────────────────────────────────

/** Duração do STEP_EMAIL token em minutos (credenciais OK → aguarda e-mail) */
export const STEP_EMAIL_TOKEN_DURATION_MINUTES = 5;

/** Duração do STEP_EMAIL token em segundos (uso interno) */
export const STEP_EMAIL_TOKEN_DURATION_SECONDS =
  STEP_EMAIL_TOKEN_DURATION_MINUTES * 60;

/** Duração do STEP_EMAIL token em milissegundos — usar em cookies */
export const STEP_EMAIL_TOKEN_DURATION_MS =
  STEP_EMAIL_TOKEN_DURATION_SECONDS * 1000;

/** String de expiração aceita pelo JwtService para STEP_EMAIL */
export const STEP_EMAIL_TOKEN_EXPIRES_IN =
  `${STEP_EMAIL_TOKEN_DURATION_MINUTES}m` as const;

/** Duração do STEP_CODE token em minutos (e-mail confirmado → aguarda OTP) */
export const STEP_CODE_TOKEN_DURATION_MINUTES = 10;

/** Duração do STEP_CODE token em segundos (uso interno) */
export const STEP_CODE_TOKEN_DURATION_SECONDS =
  STEP_CODE_TOKEN_DURATION_MINUTES * 60;

/** Duração do STEP_CODE token em milissegundos — usar em cookies */
export const STEP_CODE_TOKEN_DURATION_MS =
  STEP_CODE_TOKEN_DURATION_SECONDS * 1000;

/** String de expiração aceita pelo JwtService para STEP_CODE */
export const STEP_CODE_TOKEN_EXPIRES_IN =
  `${STEP_CODE_TOKEN_DURATION_MINUTES}m` as const;

// ─── Reset Password Token ─────────────────────────────────────────────────────

/** Duração do token de redefinição de senha em minutos */
export const RESET_PASSWORD_TOKEN_DURATION_MINUTES = 15;

/** Duração do token de redefinição de senha em segundos (uso interno) */
export const RESET_PASSWORD_TOKEN_DURATION_SECONDS =
  RESET_PASSWORD_TOKEN_DURATION_MINUTES * 60;

/** Duração do token de redefinição de senha em milissegundos — usar em cookies */
export const RESET_PASSWORD_TOKEN_DURATION_MS =
  RESET_PASSWORD_TOKEN_DURATION_SECONDS * 1000;

/** String de expiração aceita pelo JwtService para RESET_PASSWORD */
export const RESET_PASSWORD_TOKEN_EXPIRES_IN =
  `${RESET_PASSWORD_TOKEN_DURATION_MINUTES}m` as const;

// ─── Mapa de expiresIn por tipo de token ─────────────────────────────────────

/**
 * Mapa centralizado de `expiresIn` por TokenType.
 *
 * @example
 * const ttl = TOKEN_EXPIRES_IN[payload.type];
 * const token = await encrypter.encrypt(payload, ttl);
 */
export const TOKEN_EXPIRES_IN = {
  AUTH: ACCESS_TOKEN_EXPIRES_IN,
  STEP_EMAIL: STEP_EMAIL_TOKEN_EXPIRES_IN,
  STEP_CODE: STEP_CODE_TOKEN_EXPIRES_IN,
  RESET_PASSWORD: RESET_PASSWORD_TOKEN_EXPIRES_IN,
} as const satisfies Record<import("@/core/types/payload").TokenType, string>;
