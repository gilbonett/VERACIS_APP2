import {
  FederatedAuthorizationCodeExchanger,
  FederatedAuthorizationCodeInput,
  FederatedTokenResult,
} from "@/application/ports/identity/federated-authorization-code-exchanger";
import { Injectable } from "@nestjs/common";
import { authorizationCodeGrant } from "openid-client";
import { OAuthConfigurationService } from "./oauth-configuration.service";

@Injectable()
export class OAuthAuthorizationCodeExchangerService implements FederatedAuthorizationCodeExchanger {
  constructor(private readonly oauthConfig: OAuthConfigurationService) {}

  async exchange(
    input: FederatedAuthorizationCodeInput,
  ): Promise<FederatedTokenResult> {
    const config = await this.oauthConfig.get(input.provider);

    const currentUrl = new URL(input.redirectUri);
    currentUrl.searchParams.set("code", input.code);

    const tokens = await authorizationCodeGrant(config, currentUrl, {
      pkceCodeVerifier: input.codeVerifier,
      expectedNonce: input.expectedNonce,
    });

    return {
      accessToken: tokens.access_token,
      refreshToken: tokens.refresh_token ?? null,
      idToken: tokens.id_token ?? null,
      expiresIn: tokens.expires_in ?? null,
      scope: tokens.scope ?? null,
      claims: tokens.claims() ?? null,
    };
  }
}
