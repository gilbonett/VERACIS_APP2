import { expect, test } from "vitest";
import { Email } from "./email";

test("it should be able to create a valid email", () => {
  const result = Email.create("user@example.com");
  expect(result.isRight()).toBe(true);
});

test("it should not create an email without @", () => {
  const result = Email.create("user.example.com");
  expect(result.isLeft()).toBe(true);
});

test("it should not create an email without domain", () => {
  const result = Email.create("user@");
  expect(result.isLeft()).toBe(true);
});

test("it should not create an email with spaces", () => {
  const result = Email.create("user name@example.com");
  expect(result.isLeft()).toBe(true);
});

test("it should trim leading and trailing whitespace before validating", () => {
  const result = Email.create("  user@example.com  ");
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw new Error("setup failed");
  expect(result.value.toValue()).toBe("user@example.com");
});

test("it should normalize casing to lowercase", () => {
  const result = Email.create("User@Example.COM");
  expect(result.isRight()).toBe(true);
  if (result.isLeft()) throw new Error("setup failed");
  expect(result.value.toValue()).toBe("user@example.com");
});

test("it should be able to compare two emails with the same value", () => {
  const emailA = Email.create("user@example.com");
  const emailB = Email.create("user@example.com");
  if (emailA.isLeft() || emailB.isLeft()) throw new Error("setup failed");
  expect(emailA.value.equals(emailB.value)).toBe(true);
});

test("it should treat two emails with different casing as equal after normalization", () => {
  const emailA = Email.create("User@Example.com");
  const emailB = Email.create("user@example.com");
  if (emailA.isLeft() || emailB.isLeft()) throw new Error("setup failed");
  expect(emailA.value.equals(emailB.value)).toBe(true);
});

test("it should be able to compare two emails with different values", () => {
  const emailA = Email.create("user@example.com");
  const emailB = Email.create("other@example.com");
  if (emailA.isLeft() || emailB.isLeft()) throw new Error("setup failed");
  expect(emailA.value.equals(emailB.value)).toBe(false);
});
