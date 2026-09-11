import { CreateAlertCommentUseCase } from "@/domain/alerts/use-cases/create-alert-comment";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Body, Controller, NotFoundException, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { CreateAlertCommentDoc } from "../../docs/alerts/create-alert-comment.doc";
import { BodyAlertCommentDto } from "../../dtos/alerts/alert-comment.dto";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts/comments")
export class CreateAlertCommentController {
  constructor(private createAlertCommentUseCase: CreateAlertCommentUseCase) {}

  @Post()
  @CreateAlertCommentDoc()
  async handle(
    @Body() body: BodyAlertCommentDto,
    @CurrentSession() { userId, currentUserRole }: ICurrentSession,
  ) {
    const result = await this.createAlertCommentUseCase.execute({
      ...body,
      authorId: userId,
      currentUserRole,
    });

    if (result.isLeft()) {
      throw new NotFoundException(result.value);
    }
  }
}
