import { Entity } from "@/core/entities/entity";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Optional } from "@/core/types/optional";
import { Slug } from "@/core/value-objects/slug";

const REQUIRED_SCOPES = ["openid"];

export type FederatedProviderConfigProps = {
  slug: Slug;
  displayName: string;
  issuerUrl: string;
  clientId: string;
  clientSecret: string;
  jwksUri: string | null;
  scopes: Set<string>;
  redirectUri: string;
  suppliesCpfClaim: boolean;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date | null;
};

export class FederatedProviderConfig extends Entity<FederatedProviderConfigProps> {
  get slug(): Slug {
    return this.props.slug;
  }

  get displayName(): string {
    return this.props.displayName;
  }

  get issuerUrl(): string {
    return this.props.issuerUrl;
  }

  get clientId(): string {
    return this.props.clientId;
  }

  get clientSecret(): string {
    return this.props.clientSecret;
  }

  get jwksUri(): string | null {
    return this.props.jwksUri;
  }

  get scopes(): Set<string> {
    return new Set(this.props.scopes);
  }

  get redirectUri(): string {
    return this.props.redirectUri;
  }

  get suppliesCpfClaim(): boolean {
    return this.props.suppliesCpfClaim;
  }

  get enabled(): boolean {
    return this.props.enabled;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date | null {
    return this.props.updatedAt;
  }

  private touch(): void {
    this.props.updatedAt = new Date();
  }

  private normalizeScope(scope: string): string {
    return scope.trim().toLowerCase();
  }

  private missingRequiredScopes(scopes: Set<string>): string[] {
    return REQUIRED_SCOPES.filter((scope) => !scopes.has(scope));
  }

  public addScope(scope: string): void {
    const normalizedScope = this.normalizeScope(scope);

    if (!normalizedScope || this.props.scopes.has(normalizedScope)) {
      return;
    }

    this.props.scopes.add(normalizedScope);
    this.touch();
  }

  public addScopes(scopes: string[]): void {
    let changed = false;

    for (const scope of scopes) {
      const normalizedScope = this.normalizeScope(scope);

      if (!normalizedScope || this.props.scopes.has(normalizedScope)) {
        continue;
      }

      this.props.scopes.add(normalizedScope);
      changed = true;
    }

    if (changed) {
      this.touch();
    }
  }

  public removeScope(scope: string): void {
    const normalizedScope = this.normalizeScope(scope);

    if (REQUIRED_SCOPES.includes(normalizedScope)) {
      return;
    }

    if (!this.props.scopes.has(normalizedScope)) {
      return;
    }

    this.props.scopes.delete(normalizedScope);
    this.touch();
  }

  public updateConfiguration(
    props: Partial<
      Omit<
        FederatedProviderConfigProps,
        "slug" | "createdAt" | "updatedAt" | "enabled"
      >
    >,
  ): void {
    if (props.scopes) {
      const normalized = new Set(
        Array.from(props.scopes, (scope) => this.normalizeScope(scope)),
      );

      if (this.props.enabled) {
        const missing = this.missingRequiredScopes(normalized);
        if (missing.length > 0) {
          throw new Error(
            `Cannot update federated provider "${this.props.slug.value}" while enabled: this update would drop required scope(s) ${missing.join(", ")}`,
          );
        }
      }

      this.props.scopes = normalized;
      const { scopes: _scopes, ...rest } = props;
      Object.assign(this.props, rest);
      this.touch();
      return;
    }

    Object.assign(this.props, props);
    this.touch();
  }

  public enable(): void {
    if (this.props.enabled) {
      return;
    }

    const missing = this.missingRequiredScopes(this.props.scopes);
    if (missing.length > 0) {
      throw new Error(
        `Cannot enable federated provider "${this.props.slug.value}": missing required scope(s) ${missing.join(", ")}`,
      );
    }

    this.props.enabled = true;
    this.touch();
  }

  public disable(): void {
    if (!this.props.enabled) {
      return;
    }

    this.props.enabled = false;
    this.touch();
  }

  static create(
    props: Optional<
      FederatedProviderConfigProps,
      "createdAt" | "enabled" | "jwksUri" | "updatedAt"
    >,
    id?: UniqueEntityID,
  ): FederatedProviderConfig {
    const scopes = new Set(
      Array.from(props.scopes, (scope) => scope.trim().toLowerCase()),
    );
    const enabled = props.enabled ?? true;

    if (enabled) {
      const missing = REQUIRED_SCOPES.filter((scope) => !scopes.has(scope));
      if (missing.length > 0) {
        throw new Error(
          `Cannot create federated provider "${props.slug.value}" as enabled: missing required scope(s) ${missing.join(", ")}`,
        );
      }
    }

    return new FederatedProviderConfig(
      {
        ...props,
        scopes,
        enabled,
        jwksUri: props.jwksUri ?? null,
        createdAt: props.createdAt ?? new Date(),
        updatedAt: props.updatedAt ?? null,
      },
      id,
    );
  }

  static reconstitute(
    props: FederatedProviderConfigProps,
    id: UniqueEntityID,
  ): FederatedProviderConfig {
    return new FederatedProviderConfig(
      { ...props, scopes: new Set(props.scopes) },
      id,
    );
  }
}
