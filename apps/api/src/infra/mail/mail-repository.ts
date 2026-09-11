export abstract class MailRepository {
  abstract sendWelcome(to: string, name: string): Promise<void>;
  abstract sendOtpCode(to: string, name: string, code: string): Promise<void>;
  abstract sendPasswordReset(
    to: string,
    name: string,
    token: string,
    emailMasked: string,
  ): Promise<void>;
}
