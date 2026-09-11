import { Either, left, right } from "@/core/either";
import { BirthDateInvalidError } from "../errors/birth-date-invalid-error";

export class BirthDate {
  private readonly value: Date;

  protected constructor(value: Date) {
    this.value = value;
  }

  toValue(): Date {
    return this.value;
  }

  equals(value: BirthDate): boolean {
    return this.value.getTime() === value.toValue().getTime();
  }

  static validate(value: Date): boolean {
    if (Number.isNaN(value.getTime())) return false;

    return value.getTime() < Date.now();
  }

  static create(value: Date): Either<BirthDateInvalidError, BirthDate> {
    if (!BirthDate.validate(value)) {
      return left(new BirthDateInvalidError());
    }

    return right(new BirthDate(value));
  }

  static fromString(value: string): BirthDate {
    return new BirthDate(new Date(value));
  }
}
