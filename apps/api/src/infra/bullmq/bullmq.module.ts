import { BullModule } from "@nestjs/bullmq";
import { Module } from "@nestjs/common";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";
import { BullmqConfigService } from "./bullmq-config.service";
import { QueueModule } from "./queue/queue.module";

@Module({
  imports: [
    BullModule.forRootAsync({
      imports: [EnvModule],
      inject: [EnvService],
      useClass: BullmqConfigService,
    }),
    QueueModule,
  ],
  exports: [QueueModule],
})
export class BullmqModule {}
