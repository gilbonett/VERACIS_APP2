import { Either, left, right } from "@/core/either";
import { Injectable, Logger } from "@nestjs/common";
import { AlertNotAcceptedError } from "../errors/alert-not-accepted-error";
import { AlertNotFoundError } from "../errors/alert-not-found-error";
import { AlertRepository } from "../repositories/alert-repository";

interface CloseExpiredAcceptedAlertUseCaseRequest {
  alertId: string;
}

type CloseExpiredAcceptedAlertUseCaseResponse = Either<
  AlertNotFoundError | AlertNotAcceptedError,
  void
>;

@Injectable()
export class CloseExpiredAcceptedAlertUseCase {
  private readonly logger = new Logger(CloseExpiredAcceptedAlertUseCase.name);

  constructor(private alertRepository: AlertRepository) {}

  async execute({
    alertId,
  }: CloseExpiredAcceptedAlertUseCaseRequest): Promise<CloseExpiredAcceptedAlertUseCaseResponse> {
    const alert = await this.alertRepository.findById(alertId);

    if (!alert) {
      this.logger.warn(`Alert not found: ${alertId}`);

      return left(new AlertNotFoundError());
    }

    if (!alert.isAccepted) {
      this.logger.warn(`Alert not accepted: ${alertId}`);
      return left(new AlertNotAcceptedError());
    }

    alert.doClose();
    await this.alertRepository.save(alert);

    return right(undefined);
  }
}
