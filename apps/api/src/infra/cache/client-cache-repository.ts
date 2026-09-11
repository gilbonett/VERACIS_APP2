import { Injectable } from "@nestjs/common";
import { RedisService } from "../redis/redis.service";
import { ObserveCache } from "../telemetry/decorators/observe-cache.decorator";
import { CacheRepository } from "./cache-repository";

@Injectable()
export class ClientCacheRepository implements CacheRepository {
  constructor(private redis: RedisService) {}

  private TTL_SECONDS = 15 * 60; // 15 minuts

  @ObserveCache({ operation: "set", keyPrefix: "client" })
  async set(key: string, value: string): Promise<void> {
    await this.redis.set(key, value, "EX", this.TTL_SECONDS);
  }

  @ObserveCache({ operation: "get", keyPrefix: "client" })
  async get(key: string): Promise<string | null> {
    return await this.redis.get(key);
  }

  @ObserveCache({ operation: "delete", keyPrefix: "client" })
  async delete(key: string): Promise<void> {
    await this.redis.del(key);
  }
}
