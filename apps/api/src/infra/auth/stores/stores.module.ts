import { AuthStore } from '@/application/stores/auth-store'
import { RateLimiterStore } from '@/application/stores/rate-limiter-store'
import { RefreshLockStore } from '@/application/stores/refresh-lock-store'
import { RedisModule } from '@/infra/redis/redis.module'
import { Module } from '@nestjs/common'
import { RedisAuthStore } from './redis-auth-store'
import { RedisRateLimiterStore } from './redis-rate-limiter-store'
import { RedisRefreshLockStore } from './redis-refresh-lock-store'

@Module({
  imports: [RedisModule.forRoot({ prefix: 'auth' })],
  providers: [
    {
      provide: RateLimiterStore,
      useClass: RedisRateLimiterStore,
    },
    {
      provide: RefreshLockStore,
      useClass: RedisRefreshLockStore,
    },
    {
      provide: AuthStore,
      useClass: RedisAuthStore,
    },
  ],
  exports: [RateLimiterStore, RefreshLockStore, AuthStore],
})
export class StoresModule {}
