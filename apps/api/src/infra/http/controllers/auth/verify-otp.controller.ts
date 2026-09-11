import { VerifyOtpUseCase } from "@/domain/auth/use-cases/verify-otp.use-case";
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
import { Cookie } from "../../decorators/cookie.decorator";
import { Public } from "../../decorators/public.decorator";
import { VerifyOtpDoc } from "../../docs/auth/verify-otp.doc";
import { VerifyOtpDto } from "../../dtos/auth/verify-otp.dto";

@Public()
@ApiTags(SWAGGER_TAGS.AUTH)
@Controller("session/otp/verify")
export class VerifyOtpController {
  constructor(
    private readonly verifyOtp: VerifyOtpUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @HttpCode(200)
  @VerifyOtpDoc()
  async handle(
    @Body() body: VerifyOtpDto,
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Cookie(COOKIE_NAMES.CHAGELLE_TOKEN) challengeToken: string,
  ) {
    const result = await this.verifyOtp.execute({
      challengeToken,
      code: body.code,
      userAgent: req.headers["user-agent"] ?? null,
      ipAddress: req.ip ?? null,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    CookiesService.set(
      res,
      COOKIE_NAMES.SESSION_TOKEN,
      result.value.sessionToken,
      {
        maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days in milliseconds
        domain: this.env.get("COOKIE_DOMAIN"),
      },
    );
    CookiesService.delete(res, COOKIE_NAMES.CHAGELLE_TOKEN, {
      domain: this.env.get("COOKIE_DOMAIN"),
    });

    return { step: "done" };
  }
}
