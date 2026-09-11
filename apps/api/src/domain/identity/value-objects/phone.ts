import { Either, left, right } from "@/core/either";
import { PhoneInvalidError } from "../errors/phone-invalid-error";

export class Phone {
  private readonly value: string;

  protected constructor(value: string) {
    this.value = value;
  }

  toValue(): string {
    return this.value;
  }

  equals(value: Phone): boolean {
    return this.value === value.toValue();
  }

  static validate(value: string): boolean {
    const phone = Phone.normalize(value);

    return /^\d{10,11}$/.test(phone);
  }

  static create(value: string): Either<PhoneInvalidError, Phone> {
    if (!Phone.validate(value)) {
      return left(new PhoneInvalidError());
    }

    return right(new Phone(Phone.normalize(value)));
  }

  static fromString(value: string): Phone {
    return new Phone(Phone.normalize(value));
  }

  static normalize(value: string): string {
    return value.replace(/\D/g, "");
  }
}
