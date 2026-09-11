import { expect, test } from "vitest";
import { Phone } from "./phone";

test("it should be able to create a valid mobile phone (11 digits)", () => {
  const result = Phone.create("(11) 98765-4321");

  expect(result.isRight()).toBe(true);
});

test("it should be able to create a valid landline phone (10 digits)", () => {
  const result = Phone.create("(11) 3456-7890");

  expect(result.isRight()).toBe(true);
});

test("it should not create a phone with too few digits", () => {
  const result = Phone.create("123456789");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a phone with too many digits", () => {
  const result = Phone.create("119876543210");

  expect(result.isLeft()).toBe(true);
});

test("it should be able to compare two phones with the same value", () => {
  const phoneA = Phone.create("(11) 98765-4321");
  const phoneB = Phone.create("(11) 98765-4321");

  if (phoneA.isLeft() || phoneB.isLeft()) throw new Error("setup failed");

  expect(phoneA.value.equals(phoneB.value)).toBe(true);
});

test("it should be able to compare two phones with different values", () => {
  const phoneA = Phone.create("(11) 98765-4321");
  const phoneB = Phone.create("(11) 91234-5678");

  if (phoneA.isLeft() || phoneB.isLeft()) throw new Error("setup failed");

  expect(phoneA.value.equals(phoneB.value)).toBe(false);
});
