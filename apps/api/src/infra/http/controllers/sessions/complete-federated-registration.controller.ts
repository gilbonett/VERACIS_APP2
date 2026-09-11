import { CompleteFederatedRegistrationUseCase } from "@/application/use-cases/identity/complete-federated-registration-use-case";
import { HeaderDeviceName } from "@/common/decorators/header-device-name.decorator";
import { HeaderUserAgent } from "@/common/decorators/header-user-agent.decorator";
import { CurrentFederatedAttempt } from "@/infra/auth/decorators/current-federated-attempt";
import { FederatedAttemptGuard } from "@/infra/auth/guards/federated-attempt.guard";
import { Public } from "@/infra/auth/jwt/public";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Ip,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { setAuthCookies } from "../../cookies/auth-cookies";
import { clearFederatedAttemptCookie } from "../../cookies/federated-flow-cookies";
import type { CompleteFederatedRegistrationBody } from "../../schemas/sessions/complete-federated-registration.schema";
import { completeFederatedRegistrationSchema } from "../../schemas/sessions/complete-federated-registration.schema";

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller("session/federated/complete-registration")
export class CompleteFederatedRegistrationController {
  constructor(
    private completeFederatedRegistrationUseCase: CompleteFederatedRegistrationUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @HttpCode(200)
  @UseGuards(FederatedAttemptGuard)
  async handle(
    @Res({ passthrough: true }) res: Response,
    @Body({ schema: completeFederatedRegistrationSchema })
    body: CompleteFederatedRegistrationBody,
    @CurrentFederatedAttempt() federatedOnboardingId: string,
    @HeaderUserAgent() userAgent: string,
    @HeaderDeviceName() deviceName: string,
    @Ip() ipAddress: string,
  ) {
    const domain = this.env.get("COOKIE_DOMAIN");

    const result = await this.completeFederatedRegistrationUseCase.execute({
      ...body,
      federatedOnboardingId,
      deviceName,
      ipAddress,
      userAgent,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    const { accessToken, refreshToken } = result.value;

    setAuthCookies(res, { accessToken, refreshToken }, domain);
    clearFederatedAttemptCookie(res, domain);

    return { status: "AUTHENTICATED" };
  }
}
