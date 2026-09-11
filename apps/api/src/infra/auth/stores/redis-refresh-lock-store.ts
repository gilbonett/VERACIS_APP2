import { RefreshLockStore } from '@/application/stores/refresh-lock-store'
import { RedisUnavailableError } from '@/infra/redis/redis-unavailable.error'
import { RedisService } from '@/infra/redis/redis.service'
import { Injectable, Logger } from '@nestjs/common'
import { randomUUID } from 'node:crypto'

const RELEASE_SCRIPT = `
if redis.call('GET', KEYS[1]) == ARGV[1] then
  return redis.call('DEL', KEYS[1])
end
return 0
`

@Injectable()
export class RedisRefreshLockStore implements RefreshLockStore {
  private readonly logger = new Logger(RedisRefreshLockStore.name)

  constructor(private redis: RedisService) {}

  async acquire(sessionId: string, ttlMs: number): Promise<string | null> {
    const lockToken = randomUUID()

    try {
      const result = await this.redis.resilient(() =>
        this.redis.set(this.key(sessionId), lockToken, 'PX', ttlMs, 'NX'),
      )

      return result === 'OK' ? lockToken : null
    } catch (error) {
      if (error instanceof RedisUnavailableError) {
        this.logger.warn('Refresh lock unavailable; failing open')
        return lockToken
      }
      throw error
    }
  }

  async release(sessionId: string, lockToken: string): Promise<void> {
    try {
      await this.redis.resilient(() =>
        this.redis.eval(RELEASE_SCRIPT, 1, this.key(sessionId), lockToken),
      )
    } catch (error) {
      if (error instanceof RedisUnavailableError) {
        this.logger.warn('Refresh lock unavailable; skipping release')
        return
      }
      throw error
    }
  }

  private key(sessionId: string): string {
    return `session-refresh-lock:${sessionId}`
  }
}
