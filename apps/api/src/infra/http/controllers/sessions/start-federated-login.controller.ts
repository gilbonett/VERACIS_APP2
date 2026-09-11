import { StartFederatedLoginUseCase } from "@/application/use-cases/identity/start-federated-login.use-case";

import { Public } from "@/infra/auth/jwt/public";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Controller,
  HttpCode,
  Param,
  Post,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { setFederatedAttemptCookie } from "../../cookies/federated-flow-cookies";

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller("session/federated/:slug/start")
export class StartFederatedLoginController {
  constructor(
    private startFederatedLoginUseCase: StartFederatedLoginUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @HttpCode(200)
  async handle(
    @Res({ passthrough: true }) res: Response,
    @Param("slug") slug: string,
  ) {
    const result = await this.startFederatedLoginUseCase.execute({
      slug,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    setFederatedAttemptCookie(
      res,
      result.value.federatedAttemptId,
      this.env.get("COOKIE_DOMAIN"),
    );

    return { authorizationUrl: result.value.authorizationUrl };
  }
}
