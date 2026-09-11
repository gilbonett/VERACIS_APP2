import { SignInUseCase } from "@/domain/auth/use-cases/sign-in.use-case";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request, Response } from "express";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { CookiesService } from "../../cookies/cookie.service";
import { Public } from "../../decorators/public.decorator";
import { SignInDoc } from "../../docs/auth/sign-in.doc";
import { SignInDto } from "../../dtos/auth/sign-in.dto";

@Public()
@ApiTags(SWAGGER_TAGS.AUTH)
@Controller("session/sign-in")
export class SignInController {
  constructor(
    private readonly signIn: SignInUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @HttpCode(200)
  @SignInDoc()
  async handle(
    @Body() body: SignInDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const result = await this.signIn.execute({
      cpf: body.cpf,
      password: body.password,
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    const output = result.value;

    if (output.step === "done") {
      CookiesService.set(res, COOKIE_NAMES.SESSION_TOKEN, output.sessionToken, {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        domain: this.env.get("COOKIE_DOMAIN"),
      });

      return {
        step: "DONE",
      };
    }

    CookiesService.set(
      res,
      COOKIE_NAMES.CHAGELLE_TOKEN,
      output.challengeToken,
      {
        maxAge: 10 * 60 * 1000, // 10 minutes in milliseconds
        domain: this.env.get("COOKIE_DOMAIN"),
      },
    );

    return {
      step: "PENDING_EMAIL",
      emailMasked: output.maskEmail,
    };
  }
}
