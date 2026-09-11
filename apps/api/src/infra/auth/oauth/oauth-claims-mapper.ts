import { CallbackResult } from "@/application/ports/identity/federated-authentication-callback";
import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";

export type TokenClaimsToMap = {
  accessToken: string;
  refreshToken: string | null;
  idToken: string | null;
  accessTokenExpiresAt: Date | null;
  scope: string | null;
};

export function mapClaimsToCallbackResult(
  subject: string,
  claims: Record<string, unknown>,
  provider: FederatedProviderConfig,
  tokens: TokenClaimsToMap,
): CallbackResult {
  const email = getStringClaim(claims, "email");
  const name = getStringClaim(claims, "name");
  const cpf = getCpfClaim(claims, provider);

  const identityIdentifier =
    provider.suppliesCpfClaim
      ? cpf
        ? {
            type: "CPF" as const,
            value: cpf,
          }
        : null
      : email
        ? {
            type: "EMAIL" as const,
            value: email,
          }
        : null;

  return {
    subject,
    email,
    name,
    cpf,
    identityIdentifier,
    rawAssuranceClaim: getStringClaim(claims, "acr"),
    accessToken: tokens.accessToken,
    refreshToken: tokens.refreshToken,
    idToken: tokens.idToken,
    accessTokenExpiresAt: tokens.accessTokenExpiresAt,
    scope: tokens.scope,
  };
}

function getCpfClaim(
  claims: Record<string, unknown>,
  provider: FederatedProviderConfig,
): string | null {
  if (!provider.suppliesCpfClaim) {
    return null;
  }

  return getStringClaim(claims, "CPF");
}

function getStringClaim(
  claims: Record<string, unknown>,
  claim: string,
): string | null {
  const value = claims[claim];

  if (typeof value !== "string") {
    return null;
  }

  const normalized = value.trim();

  return normalized.length > 0 ? normalized : null;
}
