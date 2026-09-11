import { Uploader } from "@/domain/storage/uploader";
import { Module } from "@nestjs/common";
import { EnvModule } from "../env/env.module";
import { S3Storage } from "./s3.storage";

@Module({
  imports: [EnvModule],
  providers: [
    {
      provide: Uploader,
      useClass: S3Storage,
    },
  ],
  exports: [Uploader],
})
export class StorageModule {}
