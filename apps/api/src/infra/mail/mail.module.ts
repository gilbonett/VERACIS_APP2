import { Module } from "@nestjs/common";
import { EnvService } from "../env/env.service";
import { ClientMailService } from "./client-mail.service";
import { MailRepository } from "./mail-repository";
import { MailerFactory } from "./mailer-factory";

@Module({
  imports: [MailerFactory],
  providers: [
    EnvService,
    {
      provide: MailRepository,
      useClass: ClientMailService,
    },
  ],
  exports: [MailRepository],
})
export class MailModule {}
