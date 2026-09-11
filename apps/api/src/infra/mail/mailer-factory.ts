import { MailerModule } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "node:path";
import { EnvModule } from "../env/env.module";
import { EnvService } from "../env/env.service";

export const MailerFactory = MailerModule.forRootAsync({
  imports: [EnvModule],
  inject: [EnvService],
  useFactory(env: EnvService) {
    const isProduction = env.get("NODE_ENV") === "production";

    const templateDir = isProduction
      ? join(process.cwd(), "apps", "api", "templates")
      : join(process.cwd(), "templates");

    return {
      transport: {
        host: env.get("MAIL_HOST"),
        port: env.get("MAIL_PORT"),
        secure: env.get("MAIL_SECURE") === true,
        auth: env.get("MAIL_USER")
          ? {
              user: env.get("MAIL_USER"),
              pass: env.get("MAIL_PASS"),
            }
          : undefined,
      },
      defaults: {
        from: `"${env.get("MAIL_FROM_NAME")}" <${env.get("MAIL_FROM_EMAIL")}>`,
      },
      template: {
        dir: templateDir,
        adapter: new HandlebarsAdapter(),
        options: { strict: true },
      },
    };
  },
});
