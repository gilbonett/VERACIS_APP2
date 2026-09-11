import { OtpManager } from "@/domain/cryptography/otp-manager";

export class FakeOtpManager implements OtpManager {
  private codes: Map<string, string> = new Map();

  /**
   * Permite pré-configurar o código que será retornado para um userId específico.
   * Útil em testes para controlar o código gerado.
   */
  setCode(userId: string, code: string): void {
    this.codes.set(userId, code);
  }

  generate(userId: string): string {
    return this.codes.get(userId) ?? "123456";
  }

  verify(userId: string, code: string): boolean {
    const expected = this.generate(userId);
    return expected === code;
  }
}
