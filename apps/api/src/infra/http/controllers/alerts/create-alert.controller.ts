import { CreateAlertUseCase } from "@/domain/alerts/use-cases/create-alert";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { CreateAlertDoc } from "../../docs/communities/create-alert.doc";
import { CreateAlertDto } from "../../dtos/alerts/alert.dto";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts")
export class CreateAlertController {
  constructor(private createAlertUseCase: CreateAlertUseCase) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @CreateAlertDoc()
  async handle(
    @Body() body: CreateAlertDto,
    @CurrentSession() { userId, currentUserRole }: ICurrentSession,
  ) {
    const result = await this.createAlertUseCase.execute({
      ...body,
      currentUserRole,
      authorId: userId,
    });

    if (!result.isRight()) {
      throw new BadRequestException("Não foi possível criar o alerta.");
    }

    return { id: result.value.alert.id.toString() };
  }
}
