import {
  BullRootModuleOptions,
  SharedBullConfigurationFactory,
} from "@nestjs/bullmq";
import { Injectable } from "@nestjs/common";
import { EnvService } from "../env/env.service";

@Injectable()
export class BullmqConfigService implements SharedBullConfigurationFactory {
  constructor(private readonly env: EnvService) {}

  createSharedConfiguration(): BullRootModuleOptions {
    const host = this.env.get("REDIS_HOST");
    const port = this.env.get("REDIS_PORT");
    const password = this.env.get("REDIS_PASSWORD");

    return {
      connection: {
        host,
        port,
        password: password ? password : undefined,
        db: 0,
        connectionName: "api:bullmq",
        maxRetriesPerRequest: null,
        enableReadyCheck: false,
        lazyConnect: true,
      },
    };
  }
}
