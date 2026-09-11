import { SelectTwoFactorMethodUseCase } from "@/application/use-cases/identity/select-two-factor-method-use-case";
import { BaseController } from "@/common/controllers/base-controller";
import { CurrentLoginAttempt } from "@/infra/auth/decorators/current-login-attempt";
import { LoginAttemptGuard } from "@/infra/auth/guards/login-attempt.guard";
import { Public } from "@/infra/auth/jwt/public";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import {
  type SelectTwoFactorMethodBody,
  selectTwoFactorMethodSchema,
} from "../../schemas/sessions/select-two-factor-method.schema";

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller("session/two-factor/select")
export class SelectTwoFactorMethodController extends BaseController {
  constructor(
    private selectTwoFactorMethodUseCase: SelectTwoFactorMethodUseCase,
    protected env: EnvService,
  ) {
    super(env);
  }

  @Post()
  @HttpCode(200)
  @UseGuards(LoginAttemptGuard)
  async handle(
    @Body({ schema: selectTwoFactorMethodSchema })
    body: SelectTwoFactorMethodBody,
    @CurrentLoginAttempt() loginAttemptToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.selectTwoFactorMethodUseCase.execute({
      loginAttemptToken,
      twoFactorId: body.twoFactorId,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    this.setLoginAttemptCookie(res, loginAttemptToken);

    return { status: "CHALLENGE_ISSUED" };
  }
}
