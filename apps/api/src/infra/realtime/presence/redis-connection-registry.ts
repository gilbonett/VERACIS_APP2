import { RedisService } from "@/infra/redis/redis.service";
import { Injectable } from "@nestjs/common";
import { ConnectionRegistry } from "./connection-registry";

const PRESENCE_KEY_PREFIX = "presence:";
const PRESENCE_KEY_TTL_SECONDS = 24 * 60 * 60;

@Injectable()
export class RedisConnectionRegistry implements ConnectionRegistry {
  constructor(private readonly redis: RedisService) {}

  async register(channel: string, userId: string): Promise<void> {
    const key = this.keyFor(channel);
    await this.redis.hincrby(key, userId, 1);
    await this.redis.expire(key, PRESENCE_KEY_TTL_SECONDS);
  }

  async unregister(channel: string, userId: string): Promise<void> {
    const key = this.keyFor(channel);
    const count = await this.redis.hincrby(key, userId, -1);

    if (count <= 0) {
      await this.redis.hdel(key, userId);
    }
  }

  async isConnected(channel: string, userId: string): Promise<boolean> {
    const exists = await this.redis.hexists(this.keyFor(channel), userId);
    return exists === 1;
  }

  private keyFor(channel: string): string {
    return PRESENCE_KEY_PREFIX + channel;
  }
}
