import { CompleteFederatedLoginUseCase } from "@/application/use-cases/identity/complete-federated-login-use-case";
import { HeaderDeviceName } from "@/common/decorators/header-device-name.decorator";
import { HeaderUserAgent } from "@/common/decorators/header-user-agent.decorator";
import { CurrentFederatedAttempt } from "@/infra/auth/decorators/current-federated-attempt";
import { FederatedAttemptGuard } from "@/infra/auth/guards/federated-attempt.guard";
import { Public } from "@/infra/auth/jwt/public";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  Controller,
  Get,
  Ip,
  Param,
  Query,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { setAuthCookies } from "../../cookies/auth-cookies";
import {
  clearFederatedAttemptCookie,
  setFederatedAttemptCookie,
} from "../../cookies/federated-flow-cookies";
import type { CompleteFederatedLoginQuery } from "../../schemas/sessions/complete-federated-login.schema";
import { completeFederatedLoginSchema } from "../../schemas/sessions/complete-federated-login.schema";

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller("session/federated/:slug/callback")
export class CompleteFederatedLoginController {
  constructor(
    private completeFederatedLoginUseCase: CompleteFederatedLoginUseCase,
    private env: EnvService,
  ) {}

  @Get()
  @UseGuards(FederatedAttemptGuard)
  async handle(
    @Res() res: Response,
    @Param("slug") slug: string,
    @HeaderUserAgent() userAgent: string,
    @HeaderDeviceName() deviceName: string,
    @Query({ schema: completeFederatedLoginSchema })
    query: CompleteFederatedLoginQuery,
    @Ip() ipAddress: string,
    @CurrentFederatedAttempt() federatedAttemptId: string,
  ) {
    const COOKIE_DOMAIN = this.env.get("COOKIE_DOMAIN");
    const REDIRECT_LOGIN_URL = this.env.get("REDIRECT_LOGIN_URL");
    const REDIRECT_FEDERATED_ONBOARDING_URL = this.env.get(
      "REDIRECT_FEDERATED_ONBOARDING_URL",
    );
    const REDIRECT_FEDERATED_AUTHENTICATED_URL = this.env.get(
      "REDIRECT_FEDERATED_AUTHENTICATED_URL",
    );

    const result = await this.completeFederatedLoginUseCase.execute({
      slug,
      code: query.code,
      state: query.state,
      federatedAttemptId,
      ipAddress,
      userAgent,
      deviceName,
    });

    if (result.isLeft()) {
      clearFederatedAttemptCookie(res, COOKIE_DOMAIN);
      return res.redirect(
        `${REDIRECT_LOGIN_URL}?error=${encodeURIComponent(result.value.message)}`,
      );
    }

    const output = result.value;

    if (output.status === "AUTHENTICATED") {
      setAuthCookies(
        res,
        { accessToken: output.accessToken, refreshToken: output.refreshToken },
        COOKIE_DOMAIN,
      );
      clearFederatedAttemptCookie(res, COOKIE_DOMAIN);
      return res.redirect(REDIRECT_FEDERATED_AUTHENTICATED_URL);
    }

    setFederatedAttemptCookie(res, output.federatedOnboardingId, COOKIE_DOMAIN);

    const onboardingUrl = `${REDIRECT_FEDERATED_ONBOARDING_URL}?onboarding_id=${output.federatedOnboardingId}`;

    return res.redirect(onboardingUrl);
  }
}
