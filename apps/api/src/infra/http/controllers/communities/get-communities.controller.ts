import { GetCommunitiesUseCase } from "@/domain/communities/use-cases/get-communities-use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { GetCommunitiesDoc } from "../../docs/communities/get-communities.doc";
import { GetCommunitiesQueryDto } from "../../dtos/communities/get-communities.dto";
import { CommunityPresenter } from "../../presenters/communities/community-presenter";

@Public()
@ApiTags(SWAGGER_TAGS.COMMUNITIES)
@Controller("communities")
export class GetCommuntiesController {
  constructor(private getCommunitiesUseCase: GetCommunitiesUseCase) {}

  @Get()
  @GetCommunitiesDoc()
  async handle(@Query() query: GetCommunitiesQueryDto) {
    const resuls = await this.getCommunitiesUseCase.execute(query);

    return {
      success: true,
      data: resuls.map(CommunityPresenter.toHTTP),
    };
  }
}
