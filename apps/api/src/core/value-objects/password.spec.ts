import { expect, test } from "vitest";
import { Password } from "./password";

test("it should be able to create a valid password", () => {
  const result = Password.create("Sup3r#Secret");

  expect(result.isRight()).toBe(true);
});

test("it should not create a password shorter than 8 characters", () => {
  const result = Password.create("Sh0rt#1");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a password without an uppercase letter", () => {
  const result = Password.create("sup3r#secret");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a password without a lowercase letter", () => {
  const result = Password.create("SUP3R#SECRET");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a password without a number", () => {
  const result = Password.create("Super#Secret");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a password without a special character", () => {
  const result = Password.create("Sup3rSecret");

  expect(result.isLeft()).toBe(true);
});

test("it should be able to compare two passwords with the same value", () => {
  const passwordA = Password.create("Sup3r#Secret");
  const passwordB = Password.create("Sup3r#Secret");

  if (passwordA.isLeft() || passwordB.isLeft()) throw new Error("setup failed");

  expect(passwordA.value.equals(passwordB.value)).toBe(true);
});
