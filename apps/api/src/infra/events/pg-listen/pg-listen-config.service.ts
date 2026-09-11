import { Injectable } from "@nestjs/common";
import { readFileSync } from "node:fs";
import { ClientConfig } from "pg";
import { Options as PgListenOptions } from "pg-listen";
import { EnvService } from "../../env/env.service";

@Injectable()
export class PgListenConfigService {
  constructor(private readonly env: EnvService) {}

  createConnectionConfig(): ClientConfig {
    const isProduction = this.env.get("NODE_ENV") === "production";

    return {
      connectionString: this.env.get("DATABASE_URL"),
      ...(isProduction && {
        ssl: {
          ca: readFileSync(
            "/app/apps/api/certs/sa-east-1-bundle.pem",
          ).toString(),
          rejectUnauthorized: true,
        },
      }),
    };
  }

  createSubscriberOptions(): PgListenOptions {
    return {
      retryInterval: 5_000, // 5 segundos
      retryLimit: Infinity,
      paranoidChecking: 30_000, // 30 segundos
    };
  }
}
