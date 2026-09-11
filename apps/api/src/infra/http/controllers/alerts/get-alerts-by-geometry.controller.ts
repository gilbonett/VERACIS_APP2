import { GetAlertsByGeometryUseCase } from "@/domain/alerts/use-cases/get-alerts-by-geometry";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { BadRequestException, Controller, Get, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { GetAlertsDoc } from "../../docs/communities/get-alerts.doc";
import { AlertDetailsPresenter } from "../../presenters/alerts/alert-details-presenter";

@Public()
@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts/geometry/:lat/:lng")
export class GetAlertsByGeometryController {
  constructor(private getAlertsUseCase: GetAlertsByGeometryUseCase) {}

  @Get()
  @GetAlertsDoc()
  async handle(@Param("lat") lat: string, @Param("lng") lng: string) {
    const result = await this.getAlertsUseCase.execute({
      lat: Number(lat),
      lng: Number(lng),
    });

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return result.value.alerts.map(AlertDetailsPresenter.toHTTP);
  }
}
