import { CloseExpiredAlertUseCase } from "@/domain/alerts/use-cases/close-expired-alert";
import { Injectable } from "@nestjs/common";
import { Job } from "bullmq";
import { JobHandler } from "../../shared";
import { JOB_NAMES } from "../queue.constants";
import { AlertJobPayload } from "../types/alert-job.types";

@Injectable()
export class ExpirePendingAlertHandler implements JobHandler<AlertJobPayload> {
  readonly jobName = JOB_NAMES.EXPIRE_PENDING_ALERT;

  constructor(
    private readonly closeExpiredAlertUseCase: CloseExpiredAlertUseCase,
  ) {}

  async handle(job: Job<AlertJobPayload>): Promise<void> {
    await this.closeExpiredAlertUseCase.execute({ alertId: job.data.alertId });
  }
}
