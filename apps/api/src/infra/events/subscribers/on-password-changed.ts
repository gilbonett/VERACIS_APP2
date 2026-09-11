import { PasswordChangedEvent } from "@/domain/auth/events/password-changed-event";
import { Injectable, Logger } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnPasswordChangedRequested {
  private readonly logger = new Logger(OnPasswordChangedRequested.name);

  @OnEvent(PasswordChangedEvent)
  handle(event: PasswordChangedEvent) {
    this.logger.log(
      `Password changed for user ${event.payload.userId} at ${event.ocurredAt.toISOString()}`,
    );
  }
}
