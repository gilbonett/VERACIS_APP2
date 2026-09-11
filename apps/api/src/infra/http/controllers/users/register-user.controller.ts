import { RegisterUserUseCase } from "@/domain/users/use-cases/register-user.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  Post,
  Req,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../../decorators/public.decorator";
import { RegisterUserDoc } from "../../docs/users/register-user.doc";
import { RegisterUserDto } from "../../dtos/users/register-user.dto";

@Public()
@ApiTags(SWAGGER_TAGS.USERS)
@Controller("users")
export class RegisterUserController {
  constructor(private readonly registerUser: RegisterUserUseCase) {}

  @Post()
  @HttpCode(201)
  @RegisterUserDoc()
  async handle(
    @Body() body: RegisterUserDto,
    @Req() req: Request,
  ) {
    const result = await this.registerUser.execute({
      ...body,
      userAgent: req.headers["user-agent"],
      ipAddress: req.ip,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return { message: "Created user successfuy" };
  }
}
