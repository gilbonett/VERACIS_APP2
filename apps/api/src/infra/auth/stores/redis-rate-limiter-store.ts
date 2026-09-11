import { RateLimiterStore } from '@/application/stores/rate-limiter-store'
import { RedisUnavailableError } from '@/infra/redis/redis-unavailable.error'
import { RedisService } from '@/infra/redis/redis.service'
import { Injectable, Logger } from '@nestjs/common'

const CONSUME_SCRIPT = `
local current = redis.call('INCR', KEYS[1])
if tonumber(current) == 1 then
  redis.call('EXPIRE', KEYS[1], ARGV[1])
end
return current
`

@Injectable()
export class RedisRateLimiterStore implements RateLimiterStore {
  private readonly logger = new Logger(RedisRateLimiterStore.name)

  constructor(private redis: RedisService) {}

  async consume(
    key: string,
    limit: number,
    windowSeconds: number,
  ): Promise<boolean> {
    const redisKey = `rate-limit:${key}`

    try {
      const current = Number(
        await this.redis.resilient(() =>
          this.redis.eval(CONSUME_SCRIPT, 1, redisKey, String(windowSeconds)),
        ),
      )
      return current <= limit
    } catch (error) {
      if (error instanceof RedisUnavailableError) {
        this.logger.warn('Rate limiter unavailable; failing open')
        return true
      }
      throw error
    }
  }
}
