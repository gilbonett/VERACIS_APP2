import { Module } from "@nestjs/common";
import { RedisModule } from "../redis/redis.module";

import { CacheRepository } from "./cache-repository";
import { ClientCacheRepository } from "./client-cache-repository";

@Module({
  imports: [RedisModule.forRoot({ prefix: "cache" })],
  providers: [
    {
      provide: CacheRepository,
      useClass: ClientCacheRepository,
    },
  ],
  exports: [CacheRepository],
})
export class CacheModule {}
