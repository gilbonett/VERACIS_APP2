import {
  FederatedUserInfo,
  FederatedUserInfoFetcher,
} from "@/application/ports/identity/fererated-user-info-fetcher";
import { FederatedProviderConfig } from "@/domain/identity/entities/federated-provider-config";
import { Injectable } from "@nestjs/common";
import { fetchUserInfo } from "openid-client";
import { OAuthConfigurationService } from "./oauth-configuration.service";

@Injectable()
export class OAuthUserInfoFetcher implements FederatedUserInfoFetcher {
  constructor(private readonly oauthConfig: OAuthConfigurationService) {}

  async get(
    provider: FederatedProviderConfig,
    accessToken: string,
    subject: string,
  ): Promise<FederatedUserInfo> {
    const config = await this.oauthConfig.get(provider);

    const userInfo = await fetchUserInfo(config, accessToken, subject);

    return {
      subject,
      email: typeof userInfo.email === "string" ? userInfo.email : null,
      name: typeof userInfo.name === "string" ? userInfo.name : null,
      claims: userInfo,
    };
  }
}
