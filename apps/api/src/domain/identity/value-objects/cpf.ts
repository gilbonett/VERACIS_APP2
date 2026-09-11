import { Either, left, right } from "@/core/either";
import { CpfBadValidError } from "../errors/cpf-bad-valid-error";

export class Cpf {
  private readonly value: string;

  protected constructor(value: string) {
    this.value = value;
  }

  toValue(): string {
    return this.value;
  }

  equals(value: Cpf): boolean {
    return this.value === value.toValue();
  }

  static validate(value: string): boolean {
    const cpf = Cpf.normalize(value);

    if (!/^\d{11}$/.test(cpf)) return false;

    if (/^(\d)\1{10}$/.test(cpf)) return false;

    const cpfArray = cpf.split("").map(Number);

    for (let j = 9; j < 11; j++) {
      let sum = 0;
      for (let i = 0; i < j; i++) {
        sum += cpfArray[i] * (j + 1 - i);
      }
      const checkDigit = ((sum * 10) % 11) % 10;
      if (checkDigit !== cpfArray[j]) return false;
    }

    return true;
  }

  static create(value: string): Either<CpfBadValidError, Cpf> {
    if (!Cpf.validate(value)) {
      return left(new CpfBadValidError());
    }

    const normalized = Cpf.normalize(value);

    return right(new Cpf(normalized));
  }

  static fromString(value: string): Cpf {
    return new Cpf(Cpf.normalize(value));
  }

  static normalize(value: string): string {
    return value.replace(/\D/g, "");
  }
}
