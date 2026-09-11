import { FederatedAuthenticationCallback } from "@/application/ports/identity/federated-authentication-callback";
import { FederatedAuthorizationUrl } from "@/application/ports/identity/federated-authentication-url";
import { FederatedAuthorizationCodeExchanger } from "@/application/ports/identity/federated-authorization-code-exchanger";
import { FederatedUserInfoFetcher } from "@/application/ports/identity/fererated-user-info-fetcher";
import { CryptographyModule } from "@/infra/cryptography/cryptography.module";
import { Module } from "@nestjs/common";
import { OauthAuthenticationCallbackService } from "./services/oauth-authenticated-callback.service";
import { OauthAuthenticatedUrlService } from "./services/oauth-authenticated-url.service";
import { OAuthAuthorizationCodeExchangerService } from "./services/oauth-authorization-code-exchanger.service";
import { OAuthConfigurationService } from "./services/oauth-configuration.service";
import { OAuthUserInfoFetcher } from "./services/oauth-user-info-fectcher.service";

@Module({
  imports: [CryptographyModule],
  providers: [
    OAuthConfigurationService,
    {
      provide: FederatedAuthenticationCallback,
      useClass: OauthAuthenticationCallbackService,
    },
    {
      provide: FederatedAuthorizationUrl,
      useClass: OauthAuthenticatedUrlService,
    },
    {
      provide: FederatedAuthorizationCodeExchanger,
      useClass: OAuthAuthorizationCodeExchangerService,
    },
    {
      provide: FederatedUserInfoFetcher,
      useClass: OAuthUserInfoFetcher,
    },
  ],
  exports: [
    FederatedAuthenticationCallback,
    FederatedAuthorizationUrl,
    FederatedAuthorizationCodeExchanger,
    FederatedUserInfoFetcher,
  ],
})
export class OAuthModule {}
