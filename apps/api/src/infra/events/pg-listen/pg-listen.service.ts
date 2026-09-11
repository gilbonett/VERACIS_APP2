import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from "@nestjs/common";
import PgListen, { Subscriber } from "pg-listen";
import { PgListenConfigService } from "./pg-listen-config.service";

@Injectable()
export class PgListenService implements OnModuleInit, OnModuleDestroy {
  private logger = new Logger(PgListenService.name);
  private subscriber: Subscriber;

  constructor(config: PgListenConfigService) {
    this.subscriber = PgListen(
      config.createConnectionConfig(),
      config.createSubscriberOptions(),
    );
  }

  async onModuleInit() {
    this.subscriber.events.on("error", (err) => {
      this.logger.error("Erro na conexão pg-listen", err);
    });

    await this.subscriber.connect();
  }

  async onModuleDestroy() {
    await this.subscriber.close();
  }

  async listener(channel: string): Promise<void> {
    await this.subscriber.listenTo(channel);
  }

  onNotification<T>(channel: string, handler: (payload: T) => void): void {
    this.subscriber.notifications.on(channel, handler);
  }
}
