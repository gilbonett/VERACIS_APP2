import { RequestPasswordResetUseCase } from "@/domain/auth/use-cases/request-password-reset.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Body, Controller, HttpCode, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { RequestPasswordResetDoc } from "../../docs/auth/request-password-reset.doc";
import { RequestPasswordResetDto } from "../../dtos/auth/request-password-reset.dto";

@Public()
@ApiTags(SWAGGER_TAGS.AUTH)
@Controller("request/password/reset")
export class RequestPasswordResetController {
  constructor(private readonly requestReset: RequestPasswordResetUseCase) {}

  @Post()
  @HttpCode(200)
  @RequestPasswordResetDoc()
  async handle(@Body() body: RequestPasswordResetDto) {
    await this.requestReset.execute({ email: body.email });

    return { message: "If the email exists, you will receive a link shortly." };
  }
}
