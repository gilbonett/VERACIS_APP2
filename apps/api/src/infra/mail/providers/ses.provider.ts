import { SES, SendEmailCommand } from "@aws-sdk/client-ses";
import { defaultProvider } from "@aws-sdk/credential-provider-node";
import { MailerOptions } from "@nestjs-modules/mailer";
import { HandlebarsAdapter } from "@nestjs-modules/mailer/adapters/handlebars.adapter";
import { join } from "node:path";
import * as nodemailer from "nodemailer";
import { EnvService } from "../../env/env.service";

export class SESProvider {
  static getConfig(env: EnvService): MailerOptions {
    const sesClient = new SES({
      region: env.get("AWS_REGION"),
      credentialDefaultProvider: defaultProvider,
    });

    const templateDir =
      env.get("NODE_ENV") === "production"
        ? join(process.cwd(), "apps", "api", "templates")
        : join(process.cwd(), "templates");

    const transport = nodemailer.createTransport({
      SES: {
        sesClient,
        SendEmailCommand,
      },
    });

    return {
      transport: transport,
      defaults: {
        from: `"${env.get("MAIL_FROM_NAME")}" <${env.get("MAIL_FROM_EMAIL")}>`,
      },
      template: {
        dir: templateDir,
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    };
  }
}
