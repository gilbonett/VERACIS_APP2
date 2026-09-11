import { ConfirmPasswordResetUseCase } from "@/domain/auth/use-cases/confirm-password-reset.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { ConfirmPasswordResetDoc } from "../../docs/auth/confirm-password-reset.doc";
import { ConfirmPasswordResetDto } from "../../dtos/auth/confirm-password-reset.dto";

@Public()
@ApiTags(SWAGGER_TAGS.AUTH)
@Controller("confirm/password/reset")
export class ConfirmPasswordResetController {
  constructor(private readonly confirmReset: ConfirmPasswordResetUseCase) {}

  @Post()
  @HttpCode(200)
  @ConfirmPasswordResetDoc()
  async handle(@Body() body: ConfirmPasswordResetDto) {
    const result = await this.confirmReset.execute({
      token: body.token,
      newPassword: body.newPassword,
    });

    if (result.isLeft()) throw new BadRequestException(result.value.message);

    return { message: "Password updated successfully." };
  }
}
