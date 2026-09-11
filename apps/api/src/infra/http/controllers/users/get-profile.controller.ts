import { GetProfileUseCase } from "@/domain/users/use-cases/get-profile.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { GetProfileDoc } from "../../docs/users/get-profile.doc";
import { UserPresenter } from "../../presenters/users/user-presenter";

@ApiTags(SWAGGER_TAGS.USERS)
@Controller("users/me")
export class GetProfileController {
  constructor(private readonly getProfile: GetProfileUseCase) {}

  @Get()
  @GetProfileDoc()
  async handle(@CurrentSession() { userId }: ICurrentSession) {
    const result = await this.getProfile.execute({
      userId,
    });

    if (result.isLeft()) throw new Error(result.value.message);

    return UserPresenter.toHTTP(result.value.user);
  }
}
