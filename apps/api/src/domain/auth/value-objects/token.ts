import { createHmac, randomBytes } from "node:crypto";

export class Token {
  private constructor(
    private readonly _plain: string,
    private readonly _hashed: string,
  ) {}

  get plain() {
    return this._plain;
  }

  get hashed() {
    return this._hashed;
  }

  static generate(secret: string): Token {
    const plain = randomBytes(32).toString("hex");
    const hashed = Token.hash(plain, secret);
    return new Token(plain, hashed);
  }

  static fromPlain(plain: string, secret: string): Token {
    return new Token(plain, Token.hash(plain, secret));
  }

  private static hash(plain: string, secret: string): string {
    return createHmac("sha256", secret).update(plain).digest("hex");
  }
}
