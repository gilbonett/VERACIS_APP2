import { Logger, OnModuleDestroy } from "@nestjs/common";
import { circuitBreaker, ConsecutiveBreaker, handleAll } from "cockatiel";
import Redis from "ioredis";
import { RedisUnavailableError } from "./redis-unavailable.error";

export abstract class RedisService extends Redis implements OnModuleDestroy {
  private readonly logger = new Logger(RedisService.name);
  private readonly breaker = circuitBreaker(handleAll, {
    halfOpenAfter: 10_000,
    breaker: new ConsecutiveBreaker(5),
  });

  abstract onModuleDestroy(): Promise<void> | Promise<"OK"> | void;

  async resilient<T>(operation: () => Promise<T>): Promise<T> {
    try {
      return await this.breaker.execute(operation);
    } catch (error) {
      this.logger.error(`Redis unavailable: ${(error as Error).message}`);
      throw new RedisUnavailableError(error);
    }
  }
}
