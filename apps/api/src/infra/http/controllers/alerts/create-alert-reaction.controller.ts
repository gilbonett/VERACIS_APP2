import { CreateAlertReactionUseCase } from "@/domain/alerts/use-cases/create-alert-reaction";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { CreateAlertReactionDoc } from "../../docs/alerts/create-alert-reaction.doc";
import { AlertReactionDto } from "../../dtos/alerts/alert-reaction.dto";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts/reactions")
export class CreateAlertReactionController {
  constructor(private createAlertReactionUseCase: CreateAlertReactionUseCase) {}

  @Post()
  @CreateAlertReactionDoc()
  async handle(
    @Body() body: AlertReactionDto,
    @CurrentSession() { userId, currentUserRole }: ICurrentSession,
  ) {
    const result = await this.createAlertReactionUseCase.execute({
      ...body,
      authorId: userId,
      currentUserRole,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return {
      message: "Reaction created successfully",
    };
  }
}
