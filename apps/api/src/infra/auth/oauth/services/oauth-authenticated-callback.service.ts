import {
  CallbackResult,
  FederatedAuthenticationCallback,
  FederatedCallbackInput,
} from "@/application/ports/identity/federated-authentication-callback";
import { FederatedAuthorizationCodeExchanger } from "@/application/ports/identity/federated-authorization-code-exchanger";
import { FederatedUserInfoFetcher } from "@/application/ports/identity/fererated-user-info-fetcher";
import { Injectable } from "@nestjs/common";
import { mapClaimsToCallbackResult } from "../oauth-claims-mapper";

@Injectable()
export class OauthAuthenticationCallbackService implements FederatedAuthenticationCallback {
  constructor(
    private readonly federatedUserInfoFetcher: FederatedUserInfoFetcher,
    private readonly authorizationCodeExchanger: FederatedAuthorizationCodeExchanger,
  ) {}

  async handle(input: FederatedCallbackInput): Promise<CallbackResult> {
    const tokens = await this.authorizationCodeExchanger.exchange({
      provider: input.provider,
      code: input.code,
      redirectUri: input.redirectUri,
      codeVerifier: input.codeVerifier,
      expectedNonce: input.expectedNonce,
    });

    const claims = tokens.claims;

    if (!claims) {
      throw new Error("No claims");
    }

    if (typeof claims.sub !== "string") {
      throw new Error("Invalid subject claim");
    }

    const user = await this.federatedUserInfoFetcher.get(
      input.provider,
      tokens.accessToken,
      claims.sub,
    );

    const mergedClaims = {
      ...tokens.claims,
      ...user,
    };

    const accessTokenExpiresAt = tokens.expiresIn
      ? new Date(Date.now() + tokens.expiresIn * 1000)
      : null;

    return mapClaimsToCallbackResult(claims.sub, mergedClaims, input.provider, {
      accessToken: tokens.accessToken,
      refreshToken: tokens.refreshToken,
      idToken: tokens.idToken,
      accessTokenExpiresAt,
      scope: tokens.scope,
    });
  }
}
