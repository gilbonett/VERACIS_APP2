import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Slug } from "@/core/value-objects/slug";
import {
  FederatedProviderConfig,
  FederatedProviderConfigProps,
} from "@/domain/identity/entities/federated-provider-config";

export function makeFederatedProviderConfig(
  override: Partial<FederatedProviderConfigProps> = {},
  id?: UniqueEntityID,
): FederatedProviderConfig {
  return FederatedProviderConfig.create(
    {
      slug: override.slug ?? Slug.createFromText("gov-br"),
      displayName: override.displayName ?? "Gov.br",
      issuerUrl: override.issuerUrl ?? "https://sso.acesso.gov.br",
      clientId: override.clientId ?? "client-01",
      clientSecret: override.clientSecret ?? "encrypted-secret",
      jwksUri: override.jwksUri ?? null,
      scopes: override.scopes ?? new Set(["openid", "email", "profile"]),
      suppliesCpfClaim: override.suppliesCpfClaim ?? true,
      redirectUri:
        override.redirectUri ??
        "https://api.example.com/session/federated/gov-br/callback",
      enabled: override.enabled ?? true,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? null,
    },
    id,
  );
}
