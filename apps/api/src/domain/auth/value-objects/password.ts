import { Either, left, right } from "@/core/either";

export type PasswordError = "TOO_SHORT" | "TOO_WEAK";

export class Password {
  static readonly MIN_LENGTH = 8;

  private constructor(private readonly raw: string) {}

  get value() {
    return this.raw;
  }

  static create(value: string): Either<PasswordError, Password> {
    if (value.length < Password.MIN_LENGTH) return left("TOO_SHORT");

    if (!/(?=.*[a-zA-Z])(?=.*\d)/.test(value)) return left("TOO_WEAK");

    return right(new Password(value));
  }

  static fromHash(hash: string): Password {
    return new Password(hash);
  }
}
