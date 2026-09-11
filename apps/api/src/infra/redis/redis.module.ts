import { EnvService } from "@/infra/env/env.service";
import { DynamicModule, Module } from "@nestjs/common";
import { ClientRedisService } from "./client-redis.service";
import { RedisService } from "./redis.service";

export interface RedisModuleOptions {
  prefix: string;
}

@Module({
  imports: [],
  providers: [
    EnvService,
    {
      provide: RedisService,
      useClass: ClientRedisService,
    },
  ],
  exports: [RedisService],
})
export class RedisModule {
  static forRoot(options: RedisModuleOptions): DynamicModule {
    return {
      module: RedisModule,
      providers: [
        EnvService,
        ClientRedisService,
        {
          provide: RedisService,
          useFactory: (base: ClientRedisService) => {
            const scoped = base.duplicate({
              keyPrefix: `app:${options.prefix}:`,
              connectionName: `api:${options.prefix}`,
            }) as RedisService;

            scoped.onModuleDestroy = () => scoped.quit();

            return scoped;
          },
          inject: [ClientRedisService],
        },
      ],
      exports: [RedisService],
    };
  }
}
