import { MailerService } from "@nestjs-modules/mailer";
import { Injectable } from "@nestjs/common";
import { EnvService } from "../env/env.service";
import { ObserveMail } from "../telemetry/decorators/observe-mail.decorator";
import { MailRepository } from "./mail-repository";

@Injectable()
export class ClientMailService implements MailRepository {
  constructor(
    private readonly mailerService: MailerService,
    private readonly env: EnvService,
  ) {}

  private get from(): string {
    return `"${this.env.get("MAIL_FROM_NAME")}" <${this.env.get("MAIL_FROM_EMAIL")}>`;
  }

  @ObserveMail({ template: "welcome" })
  async sendWelcome(to: string, name: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      from: this.from,
      subject: "Bem-vindo à Plataforma Veracis",
      template: "welcome",
      context: {
        name,
        email: to,
        redirectUrl: this.env.get("REDIRECT_LOGIN_URL"),
        year: new Date().getFullYear(),
      },
      envelope: { from: this.from, to },
    });
  }

  @ObserveMail({ template: "verify-code" })
  async sendOtpCode(to: string, name: string, code: string): Promise<void> {
    await this.mailerService.sendMail({
      to,
      from: this.from,
      subject: "Seu código de verificação",
      template: "verify-code",
      context: {
        code,
        name,
        requestedAt: new Date().toLocaleString(),
        expiresIn: "10 minutos",
        year: new Date().getFullYear(),
      },
      envelope: { from: this.from, to },
    });
  }

  @ObserveMail({ template: "password-reset" })
  async sendPasswordReset(
    to: string,
    name: string,
    token: string,
    emailMasked: string,
  ): Promise<void> {
    const redirectUrl = `${this.env.get("REDIRECT_RESET_PASSWORD_URL")}?token=${token}`;

    await this.mailerService.sendMail({
      to,
      from: this.from,
      subject: "Redefinição de Senha",
      template: "password-reset",
      context: {
        name,
        emailMasked,
        redirectUrl,
        expiresIn: "1 hora",
        year: new Date().getFullYear(),
      },
      envelope: { from: this.from, to },
    });
  }
}
