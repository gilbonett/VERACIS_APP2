import { GetAlertByIdUseCase } from "@/domain/alerts/use-cases/get-alert-by-id";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get, NotFoundException, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { GetAlertByIdDoc } from "../../docs/alerts/get-alert-by-id.doc";
import { AlertDetailsPresenter } from "../../presenters/alerts/alert-details-presenter";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts")
export class GetAlertByIdController {
  constructor(private getAlertByIdUseCase: GetAlertByIdUseCase) {}

  @Get(":alertId")
  @GetAlertByIdDoc()
  async handle(
    @Param("alertId") alertId: string,
    @CurrentSession() { userId, currentUserRole }: ICurrentSession,
  ) {
    const result = await this.getAlertByIdUseCase.execute({
      alertId,
      currentUserId: userId,
      currentUserRole,
    });

    if (result.isLeft()) {
      throw new NotFoundException(result.value);
    }

    const alert = result.value.alert;

    return AlertDetailsPresenter.toHTTP(alert);
  }
}
