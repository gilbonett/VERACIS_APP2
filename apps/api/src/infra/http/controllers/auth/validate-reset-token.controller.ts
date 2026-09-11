import { ValidateResetTokenUseCase } from "@/domain/auth/use-cases/validate-reset-token.use-case";
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
import { ValidateResetTokenDoc } from "../../docs/auth/validate-reset-token.doc";
import { ValidateResetTokenDto } from "../../dtos/auth/validate-reset-token.dto";

// Chamado pelo Next.js antes de exibir o formulário de nova senha.
@Public()
@ApiTags(SWAGGER_TAGS.AUTH)
@Controller("validate/password/reset")
export class ValidateResetTokenController {
  constructor(private readonly validateResetToken: ValidateResetTokenUseCase) {}

  @Post()
  @HttpCode(200)
  @ValidateResetTokenDoc()
  async handle(@Body() body: ValidateResetTokenDto) {
    const result = await this.validateResetToken.execute({ token: body.token });

    if (result.isLeft()) throw new BadRequestException(result.value.message);

    return { valid: true };
  }
}
