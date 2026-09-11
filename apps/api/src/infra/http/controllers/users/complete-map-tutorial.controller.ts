import { CompleteMapTutorialUseCase } from "@/domain/users/use-cases/complete-map-tutorial.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  Controller,
  HttpCode,
  NotFoundException,
  Post,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { CompleteMapTutorialDoc } from "../../docs/users/complete-map-tutorial.doc";
import { UserPresenter } from "../../presenters/users/user-presenter";

@ApiTags(SWAGGER_TAGS.USERS)
@Controller("users/me/map-tutorial")
export class CompleteMapTutorialController {
  constructor(
    private readonly completeMapTutorial: CompleteMapTutorialUseCase,
  ) {}

  @Post("complete")
  @HttpCode(200)
  @CompleteMapTutorialDoc()
  async handle(@CurrentSession() { userId }: ICurrentSession) {
    const result = await this.completeMapTutorial.execute({ userId });

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }

    return UserPresenter.toHTTP(result.value.user);
  }
}
