import { UpdateProfileUseCase } from "@/domain/users/use-cases/update-profile.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { BadRequestException, Body, Controller, Patch } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { UpdateProfileDoc } from "../../docs/users/update-profile.doc";
import { UpdateProfileDto } from "../../dtos/users/update-profile.dto";

@ApiTags(SWAGGER_TAGS.USERS)
@Controller("users")
export class UpdateProfileController {
  constructor(private updateProfile: UpdateProfileUseCase) {}

  @Patch()
  @UpdateProfileDoc()
  async handle(
    @Body() body: UpdateProfileDto,
    @CurrentSession() { userId }: ICurrentSession,
  ) {
    const result = await this.updateProfile.execute({
      userId,
      ...body,
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value);
    }

    return {
      message: "Profile updated successfully",
    };
  }
}
