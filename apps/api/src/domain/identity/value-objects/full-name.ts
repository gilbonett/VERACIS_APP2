import { Either, left, right } from "@/core/either";
import { FullNameInvalidError } from "../errors/full-name-invalid-error";

const LOWERCASE_PARTICLES = ["de", "da", "do", "das", "dos", "e"];

export class FullName {
  private readonly value: string;

  protected constructor(value: string) {
    this.value = value;
  }

  toValue(): string {
    return this.value;
  }

  equals(value: FullName): boolean {
    return this.value === value.toValue();
  }

  static validate(value: string): boolean {
    return value.trim().length >= 3;
  }

  private static format(value: string): string {
    return value
      .trim()
      .split(/\s+/)
      .map((word, index) => {
        const lower = word.toLocaleLowerCase("pt-BR");

        if (index > 0 && LOWERCASE_PARTICLES.includes(lower)) {
          return lower;
        }

        return lower.charAt(0).toLocaleUpperCase("pt-BR") + lower.slice(1);
      })
      .join(" ");
  }

  static create(value: string): Either<FullNameInvalidError, FullName> {
    if (!FullName.validate(value)) {
      return left(new FullNameInvalidError());
    }

    return right(new FullName(FullName.format(value)));
  }

  static fromString(value: string): FullName {
    return new FullName(value);
  }
}
