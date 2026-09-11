import { SignOutUseCase } from "@/domain/auth/use-cases/sign-out.use-case";
import { EnvService } from "@/infra/env/env.service";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Controller,
  HttpCode,
  Post,
  Res,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Response } from "express";
import { COOKIE_NAMES } from "../../cookies/cookie-options";
import { CookiesService } from "../../cookies/cookie.service";
import { Cookie } from "../../decorators/cookie.decorator";
import { SignOutDoc } from "../../docs/auth/sign-out.doc";

@ApiTags(SWAGGER_TAGS.AUTH)
@Controller("session/logout")
export class SignOutController {
  constructor(
    private readonly signOut: SignOutUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @HttpCode(204)
  @SignOutDoc()
  async handle(
    @Res({ passthrough: true }) res: Response,
    @Cookie(COOKIE_NAMES.SESSION_TOKEN) rawToken: string,
  ) {
    const result = await this.signOut.execute({ rawToken });

    if (result.isLeft()) {
      throw new BadRequestException(result.value);
    }

    CookiesService.delete(res, COOKIE_NAMES.SESSION_TOKEN, {
      domain: this.env.get("COOKIE_DOMAIN"),
    });

    return result.value;
  }
}
