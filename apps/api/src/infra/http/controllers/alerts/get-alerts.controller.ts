import { GetAlertsUseCase } from "@/domain/alerts/use-cases/get-alerts";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get, Query } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { GetAlertsDoc } from "../../docs/communities/get-alerts.doc";
import {
  AlertDetailsDto,
  QueryAlertDto,
} from "../../dtos/alerts/alert-details.dto";
import { AlertDetailsPresenter } from "../../presenters/alerts/alert-details-presenter";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts")
export class GetAlertsController {
  constructor(private getAlertsUseCase: GetAlertsUseCase) {}

  @Get()
  @GetAlertsDoc()
  async handle(
    @Query() query: QueryAlertDto,
    @CurrentSession() { userId, currentUserRole }: ICurrentSession,
  ): Promise<AlertDetailsDto[]> {
    const alerts = await this.getAlertsUseCase.execute({
      ...query,
      currentUserId: userId,
      currentUserRole,
    });

    return alerts.value.alerts.map(AlertDetailsPresenter.toHTTP);
  }
}
