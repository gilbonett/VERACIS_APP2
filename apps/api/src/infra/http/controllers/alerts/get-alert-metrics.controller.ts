import { GetAlertMetricsByCommunityIdUseCase } from "@/domain/alerts/use-cases/get-alert-metrics-by-community-id";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { BadRequestException, Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { GetAlertMetricsDoc } from "../../docs/alerts/get-alert-metrics.doc";
import { AlertMetricsPresenter } from "../../presenters/alerts/alert-metrics-presenter";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts")
export class GetAlertMetrcisController {
  constructor(private getAlertMetrics: GetAlertMetricsByCommunityIdUseCase) {}

  @Get("metrics")
  @GetAlertMetricsDoc()
  async handle(@CurrentSession() { userId }: ICurrentSession) {
    const alertMetrics = await this.getAlertMetrics.execute({
      currentUserId: userId,
    });

    if (alertMetrics.isLeft())
      throw new BadRequestException(alertMetrics.value.message);

    return AlertMetricsPresenter.toHTTP(alertMetrics.value.metrics);
  }
}
