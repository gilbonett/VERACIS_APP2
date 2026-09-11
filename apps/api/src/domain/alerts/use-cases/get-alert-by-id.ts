import { Either, left, right } from "@/core/either";
import { UserRole } from "@/domain/users/entities/user";
import { Injectable } from "@nestjs/common";
import { AlertNotFoundError } from "../errors/alert-not-found-error";
import { canViewHealthAlert } from "@/domain/alerts/policies/health-alert-visibility";
import { AlertDetails } from "../read-models/alert-details";
import { AlertDetailsRepository } from "../repositories/alert-details-repository";

type GetAlertByIdUseCaseRequest = {
  alertId: string;
  currentUserId: string;
  currentUserRole: UserRole;
};

type GetAlertByIdUseCaseResponse = Either<
  AlertNotFoundError,
  {
    alert: AlertDetails;
  }
>;

@Injectable()
export class GetAlertByIdUseCase {
  constructor(private alertDetailsRepository: AlertDetailsRepository) {}

  async execute({
    alertId,
    currentUserId,
    currentUserRole,
  }: GetAlertByIdUseCaseRequest): Promise<GetAlertByIdUseCaseResponse> {
    const alert = await this.alertDetailsRepository.findById(
      alertId,
      currentUserId,
    );

    if (!alert) {
      return left(new AlertNotFoundError());
    }

    if (
      !canViewHealthAlert({ alert, currentUserId, currentUserRole })
    ) {
      return left(new AlertNotFoundError());
    }

    return right({ alert });
  }
}
