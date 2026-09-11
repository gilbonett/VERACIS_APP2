import { Module } from "@nestjs/common";
import { DiscoveryModule } from "@nestjs/core";
import { BullmqModule } from "../bullmq/bullmq.module";
import { DatabaseModule } from "../database/database.module";
import { RealtimeModule } from "../realtime/realtime.module";
import { StorageModule } from "../storage/storage.module";
import { EventHandlerRegistry } from "./event-handler-registry";
import { EventExplorer } from "./event.explorer";
import { PgListenConfigService, PgListenService } from "./pg-listen";
import { PollerService } from "./poller.service";
import { EventDispatcher, EventsMetadataAccessor } from "./shared";
import { SUBSCRIBERS } from "./subscribers";

// @Global()
@Module({
  imports: [
    DiscoveryModule,
    DatabaseModule,
    RealtimeModule,
    // RealtimeModule,
    BullmqModule,
    StorageModule,
  ],
  providers: [
    PgListenConfigService,
    PgListenService,
    EventsMetadataAccessor,
    EventDispatcher,
    EventHandlerRegistry,
    EventExplorer,
    PollerService,

    ...SUBSCRIBERS,
  ],
  exports: [],
})
export class EventsModule {}
