import { Either, right } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { filterAlertsByHealthVisibility } from "@/domain/alerts/policies/health-alert-visibility";
import { AlertDetails } from "../read-models/alert-details";
import {
  AlertDetailsRepository,
  IAlertDetailsQuery,
} from "../repositories/alert-details-repository";

type GetAlertsUseCaseRequest = IAlertDetailsQuery;

type GetAlertsUseCaseResponse = Either<never, { alerts: AlertDetails[] }>;

@Injectable()
export class GetAlertsUseCase {
  constructor(private alertDetailsRepository: AlertDetailsRepository) {}

  async execute(
    query: GetAlertsUseCaseRequest,
  ): Promise<GetAlertsUseCaseResponse> {
    const alerts = await this.alertDetailsRepository.findMany(query);

    const visibleAlerts = filterAlertsByHealthVisibility(
      alerts,
      query.currentUserId,
      query.currentUserRole,
    );

    return right({ alerts: visibleAlerts });
  }
}
