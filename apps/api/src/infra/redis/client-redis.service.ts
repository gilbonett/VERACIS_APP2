import { EnvService } from "@/infra/env/env.service";
import { Injectable } from "@nestjs/common";
import { RedisService } from "./redis.service";

// Conexão base: usada como fonte de .duplicate() pelos clients escopados
// (RedisModule.forRoot) e para health check. Sem keyPrefix próprio — cada
// scope (cache/realtime/ratelimit) define o dele via forRoot({ prefix }).
@Injectable()
export class ClientRedisService extends RedisService {
  constructor(env: EnvService) {
    const password = env.get("REDIS_PASSWORD");

    super({
      host: env.get("REDIS_HOST"),
      password: password ? password : undefined,
      port: env.get("REDIS_PORT"),
      db: 0,
      maxRetriesPerRequest: 3,
      lazyConnect: true,
      connectionName: "api:base",
    });
  }

  onModuleDestroy() {
    return this.quit();
  }
}
