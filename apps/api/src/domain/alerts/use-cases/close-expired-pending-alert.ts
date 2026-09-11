import { Either, left, right } from "@/core/either";
import { Injectable, Logger } from "@nestjs/common";
import { AlertNotFoundError } from "../errors/alert-not-found-error";
import { AlertNotPendingError } from "../errors/alert-not-pending-error";
import { AlertRepository } from "../repositories/alert-repository";

interface CloseExpiredPendingAlertUseCaseRequest {
  alertId: string;
}

type CloseExpiredPendingAlertUseCaseResponse = Either<
  AlertNotFoundError | AlertNotPendingError,
  void
>;

@Injectable()
export class CloseExpiredPendingAlertUseCase {
  private readonly logger = new Logger(CloseExpiredPendingAlertUseCase.name);

  constructor(private alertRepository: AlertRepository) {}

  async execute({
    alertId,
  }: CloseExpiredPendingAlertUseCaseRequest): Promise<CloseExpiredPendingAlertUseCaseResponse> {
    const alert = await this.alertRepository.findById(alertId);

    if (!alert) {
      this.logger.warn(`Alert not found: ${alertId}`);
      return left(new AlertNotFoundError());
    }

    if (!alert.isPending) {
      this.logger.warn(`Alert is not pending: ${alertId}`);

      return left(new AlertNotPendingError());
    }

    alert.doClose();
    await this.alertRepository.save(alert);

    return right(undefined);
  }
}
