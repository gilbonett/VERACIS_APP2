import { GetEventsUseCase } from "@/domain/communities/use-cases/get-events";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetEventsDoc } from "../../docs/communities/get-events.doc";
import { EventPresenter } from "../../presenters/communities/event-presenter";

@ApiTags(SWAGGER_TAGS.EVENTS)
@Controller("events")
export class GetEventsController {
  constructor(private getEventsUseCase: GetEventsUseCase) {}

  @Get()
  @GetEventsDoc()
  async handle() {
    const events = await this.getEventsUseCase.execute();

    return events.map(EventPresenter.toHTTP);
  }
}
