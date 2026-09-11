import { ConfirmTwoFactorChallengeUseCase } from "@/application/use-cases/identity/confirm-two-factor-method-use-case";
import { InvalidOtpCodeError } from "@/domain/identity/errors/invalid-otp-code-error";
import { OtpAttemptsExceededError } from "@/domain/identity/errors/otp-attempts-exceeded-error";
import { TwoFactorChallengeExpiredError } from "@/domain/identity/errors/two-factor-challenge-expired-error";
import { TwoFactorChallengeNotFoundError } from "@/domain/identity/errors/two-factor-challenge-not-found-error";
import { CurrentLoginAttempt } from "@/infra/auth/decorators/current-login-attempt";
import { LoginAttemptGuard } from "@/infra/auth/guards/login-attempt.guard";
import { Public } from "@/infra/auth/jwt/public";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  GoneException,
  HttpCode,
  HttpException,
  HttpStatus,
  NotFoundException,
  Post,
  Res,
  UseGuards,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";

import { BaseController } from "@/common/controllers/base-controller";
import type { ConfirmTwoFactorMethodBody } from "../../schemas/sessions/confirm-two-factor-method.schema";
import { confirmTwoFactorMethodSchema } from "../../schemas/sessions/confirm-two-factor-method.schema";

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller("session/two-factor/confirm")
export class ConfirmTwoFactorMethodController extends BaseController {
  constructor(
    private confirmTwoFactorChallengeUseCase: ConfirmTwoFactorChallengeUseCase,
    protected env: EnvService,
  ) {
    super(env);
  }

  @Post()
  @HttpCode(200)
  @UseGuards(LoginAttemptGuard)
  async handle(
    @Body({ schema: confirmTwoFactorMethodSchema })
    body: ConfirmTwoFactorMethodBody,
    @CurrentLoginAttempt() loginAttemptToken: string,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.confirmTwoFactorChallengeUseCase.execute({
      loginAttemptToken,
      code: body.code,
    });

    if (result.isLeft()) {
      const error = result.value;

      switch (error.constructor) {
        case TwoFactorChallengeNotFoundError:
          this.clearLoginAttemptCookie(res);

          throw new NotFoundException(error.message);
        case TwoFactorChallengeExpiredError:
          this.clearLoginAttemptCookie(res);

          throw new GoneException(error.message);
        case InvalidOtpCodeError:
          throw new BadRequestException(error.message);
        case OtpAttemptsExceededError:
          this.clearLoginAttemptCookie(res);

          throw new HttpException(error.message, HttpStatus.TOO_MANY_REQUESTS);
        default:
          throw new BadRequestException(error.message);
      }
    }

    const tokens = result.value;

    this.setAuthCookies(res, tokens);
    this.clearLoginAttemptCookie(res);

    return { status: "AUTHENTICATED" };
  }
}
