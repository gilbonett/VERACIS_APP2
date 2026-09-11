import { SignInUseCase } from "@/application/use-cases/identity/sign-in-use-case";
import { BaseController } from "@/common/controllers/base-controller";
import { HeaderDeviceName } from "@/common/decorators/header-device-name.decorator";
import { HeaderUserAgent } from "@/common/decorators/header-user-agent.decorator";
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
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import type { SignInBody } from "../../schemas/sessions/sign-in.schema";
import { signInSchema } from "../../schemas/sessions/sign-in.schema";

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller("session/sign-in")
export class SignInController extends BaseController {
  constructor(
    private signInUseCase: SignInUseCase,
    protected env: EnvService,
  ) {
    super(env);
  }

  @Post()
  @HttpCode(200)
  async handle(
    @Res({ passthrough: true }) res: Response,
    @Body({ schema: signInSchema }) body: SignInBody,
    @HeaderUserAgent() userAgent: string,
    @HeaderDeviceName() deviceName: string,
    @Ip() ipAddress: string,
  ) {
    const result = await this.signInUseCase.execute({
      cpf: body.cpf,
      password: body.password,
      deviceName,
      ipAddress,
      userAgent,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    const output = result.value;

    if (output.status === "AUTHENTICATED") {
      this.setAuthCookies(res, {
        accessToken: output.accessToken,
        refreshToken: output.refreshToken,
      });

      return { status: "AUTHENTICATED" };
    }

    this.setLoginAttemptCookie(res, output.loginAttemptToken);

    return {
      status: "TWO_FACTOR_REQUIRED",
      methods: output.methods,
    };
  }
}
