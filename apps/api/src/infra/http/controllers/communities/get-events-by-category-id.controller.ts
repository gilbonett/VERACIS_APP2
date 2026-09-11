import { GetEventsByCategoryIdUseCase } from "@/domain/communities/use-cases/get-events-by-category-id";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetEventsByCategoryIdDoc } from "../../docs/communities/get-events-by-category-id.doc";
import { CategoryIdParamsDto } from "../../dtos/communities/get-events-by-category-id.dto";
import { EventPresenter } from "../../presenters/communities/event-presenter";

@ApiTags(SWAGGER_TAGS.EVENTS)
@Controller("/events/category/:categoryId")
export class GetEventsByCategoryIdController {
  constructor(
    private getEventsByCategoryIdUseCase: GetEventsByCategoryIdUseCase,
  ) {}

  @Get()
  @GetEventsByCategoryIdDoc()
  async handle(@Param() params: CategoryIdParamsDto) {
    const results = await this.getEventsByCategoryIdUseCase.execute({
      categoryId: params.categoryId,
    });

    const events = results.value.events;

    return events.map(EventPresenter.toHTTP);
  }
}
