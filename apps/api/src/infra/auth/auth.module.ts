import { Module } from "@nestjs/common";
import { JwtModule } from "./jwt/jwt.module";
import { OAuthModule } from "./oauth/oauth-module";
import { StoresModule } from "./stores/stores.module";

@Module({
  imports: [JwtModule, OAuthModule, StoresModule],
  exports: [JwtModule, OAuthModule, StoresModule],
})
export class AuthModule {}
