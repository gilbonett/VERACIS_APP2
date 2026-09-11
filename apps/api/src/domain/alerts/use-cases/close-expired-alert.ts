import { Either, left, right } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { Alert } from "../entities/alert";
import { AlertNotFoundError } from "../errors/alert-not-found-error";
import { AlertRepository } from "../repositories/alert-repository";

interface CloseExpiredAlertUseCaseRequest {
  alertId: string;
}

type CloseExpiredAlertUseCaseResponse = Either<
  AlertNotFoundError,
  { alert: Alert }
>;

@Injectable()
export class CloseExpiredAlertUseCase {
  constructor(private alertRepository: AlertRepository) {}

  async execute({
    alertId,
  }: CloseExpiredAlertUseCaseRequest): Promise<CloseExpiredAlertUseCaseResponse> {
    const alert = await this.alertRepository.findById(alertId);

    if (!alert) {
      return left(new AlertNotFoundError());
    }

    alert.doClose();

    await this.alertRepository.save(alert);

    return right({
      alert,
    });
  }
}
