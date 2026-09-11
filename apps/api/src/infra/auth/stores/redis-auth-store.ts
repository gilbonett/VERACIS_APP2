import { AuthStore, AuthStoreCasResult } from '@/application/stores/auth-store'
import { RedisService } from '@/infra/redis/redis.service'
import { Injectable } from '@nestjs/common'

const COMPARE_AND_SWAP_SCRIPT = `
local current = redis.call('GET', KEYS[1])
if current == false then
  return -1
end
if current ~= ARGV[1] then
  return 0
end
redis.call('SET', KEYS[1], ARGV[2], 'EX', ARGV[3])
return 1
`

const CONSUME_SCRIPT = `
local value = redis.call('GET', KEYS[1])
if value then redis.call('DEL', KEYS[1]) end
return value
`

@Injectable()
export class RedisAuthStore implements AuthStore {
  constructor(private redis: RedisService) {}

  async issue<T>(
    prefix: string,
    id: string,
    state: T,
    ttlSeconds: number,
  ): Promise<void> {
    await this.redis.resilient(() =>
      this.redis.set(
        this.key(prefix, id),
        JSON.stringify(state),
        'EX',
        ttlSeconds,
      ),
    )
  }

  async read<T>(prefix: string, id: string): Promise<T | null> {
    const value = await this.redis.resilient(() =>
      this.redis.get(this.key(prefix, id)),
    )

    return value ? JSON.parse(value) : null
  }

  async compareAndSwap<T>(
    prefix: string,
    id: string,
    expected: T,
    next: T,
    ttlSeconds: number,
  ): Promise<AuthStoreCasResult> {
    const result = await this.redis.resilient(() =>
      this.redis.eval(
        COMPARE_AND_SWAP_SCRIPT,
        1,
        this.key(prefix, id),
        JSON.stringify(expected),
        JSON.stringify(next),
        String(ttlSeconds),
      ),
    )

    if (result === 1) return { success: true }
    if (result === -1) return { success: false, reason: 'NOT_FOUND' }
    return { success: false, reason: 'STATE_MISMATCH' }
  }

  async revoke(prefix: string, id: string): Promise<void> {
    await this.redis.resilient(() => this.redis.del(this.key(prefix, id)))
  }

  async consume<T>(prefix: string, id: string): Promise<T | null> {
    const value = await this.redis.resilient(() =>
      this.redis.eval(CONSUME_SCRIPT, 1, this.key(prefix, id)),
    )

    return value ? JSON.parse(value as string) : null
  }

  private key(prefix: string, id: string): string {
    return `${prefix}:${id}`
  }
}
