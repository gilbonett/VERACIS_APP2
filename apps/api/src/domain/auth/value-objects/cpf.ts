import { Either, left, right } from "@/core/either";
import { InvalidCredentialsError } from "../errors/invalid-credentials-error";

export class Cpf {
  private readonly _value: string;

  private constructor(value: string) {
    this._value = value;
  }

  toString() {
    return this._value;
  }

  static create(raw: string): Either<InvalidCredentialsError, Cpf> {
    const digits = raw.replace(/\D/g, "");
    if (!Cpf.validate(digits)) return left(new InvalidCredentialsError());
    return right(new Cpf(digits));
  }

  static fromString(value: string): Cpf {
    const digits = value.replace(/\D/g, "");
    return new Cpf(digits);
  }

  static normalize(value: string): string {
    return value.replace(/\D/g, "");
  }

  private static validate(digits: string): boolean {
    if (digits.length !== 11 || /^(\d)\1{10}$/.test(digits)) return false;
    const calc = (len: number) => {
      let sum = 0;
      for (let i = 0; i < len; i++) sum += +digits[i] * (len + 1 - i);
      const rest = (sum * 10) % 11;
      return rest === 10 ? 0 : rest;
    };
    return calc(9) === +digits[9] && calc(10) === +digits[10];
  }
}
