import { Injectable, Logger } from "@nestjs/common";
import { Cron, CronExpression } from "@nestjs/schedule";

@Injectable()
export class OnCleanExpiredSessionTask {
  private readonly logger = new Logger(OnCleanExpiredSessionTask.name);

  @Cron(CronExpression.EVERY_HOUR)
  async task() {
    this.logger.debug("Running task...");
  }
}
