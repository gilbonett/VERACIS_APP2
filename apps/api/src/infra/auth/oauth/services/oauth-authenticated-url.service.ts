import {
  AuthorizationRequest,
  FederatedAuthorizationUrl,
} from "@/application/ports/identity/federated-authentication-url";
import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";
import { Injectable } from "@nestjs/common";
import { randomUUID } from "node:crypto";
import {
  buildAuthorizationUrl,
  calculatePKCECodeChallenge,
  randomPKCECodeVerifier,
  randomState,
} from "openid-client";
import { OAuthConfigurationService } from "./oauth-configuration.service";

@Injectable()
export class OauthAuthenticatedUrlService implements FederatedAuthorizationUrl {
  constructor(private readonly oauthConfig: OAuthConfigurationService) {}

  async build(
    provider: FederatedProviderConfig,
  ): Promise<AuthorizationRequest> {
    const config = await this.oauthConfig.get(provider);
    const state = randomState();
    const nonce = randomUUID();

    const codeVerifier = randomPKCECodeVerifier();
    const codeChallenge = await calculatePKCECodeChallenge(codeVerifier);

    const authorizationUrl = buildAuthorizationUrl(config, {
      redirect_uri: provider.redirectUri,
      scope: Array.from(provider.scopes).join(" "),
      response_type: "code",
      state,
      nonce,
      code_challenge: codeChallenge,
      code_challenge_method: "S256",
    });

    return {
      authorizationUrl: authorizationUrl.toString(),
      state,
      nonce,
      codeVerifier,
    };
  }
}
