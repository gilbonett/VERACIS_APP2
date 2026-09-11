import { Either, left, right } from "@/core/either";
import { Validate } from "@/core/validations/validate";
import { PasswordInvalidError } from "./errors/password-invalid-error";

export class Password {
  private readonly value: string;

  protected constructor(value: string) {
    this.value = value;
  }

  toValue(): string {
    return this.value;
  }

  equals(value: Password): boolean {
    return this.value === value.toValue();
  }

  static validate(value: string): boolean {
    return Validate.isValidPassword(value) === undefined;
  }

  static create(value: string): Either<PasswordInvalidError, Password> {
    if (!Password.validate(value)) {
      return left(new PasswordInvalidError());
    }

    return right(new Password(value));
  }

  static fromString(value: string): Password {
    return new Password(value);
  }
}
