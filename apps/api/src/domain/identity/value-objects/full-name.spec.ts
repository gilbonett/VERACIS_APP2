import { expect, test } from "vitest";
import { FullName } from "./full-name";

test("it should be able to create a valid full name", () => {
  const result = FullName.create("Maria Silva");

  expect(result.isRight()).toBe(true);
});

test("it should trim surrounding whitespace", () => {
  const result = FullName.create("  Maria Silva  ");

  expect(result.isRight()).toBe(true);
  if (result.isRight()) {
    expect(result.value.toValue()).toBe("Maria Silva");
  }
});

test("it should not create an empty name", () => {
  const result = FullName.create("   ");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a name shorter than 3 characters", () => {
  const result = FullName.create("Jo");

  expect(result.isLeft()).toBe(true);
});

test("it should fix messy capitalization", () => {
  const result = FullName.create("ViCtor CARvalho");

  expect(result.isRight()).toBe(true);
  if (result.isRight()) {
    expect(result.value.toValue()).toBe("Victor Carvalho");
  }
});

test("it should keep name particles lowercase, except when first", () => {
  const result = FullName.create("victor DE carvalho DOS santos");

  expect(result.isRight()).toBe(true);
  if (result.isRight()) {
    expect(result.value.toValue()).toBe("Victor de Carvalho dos Santos");
  }
});

test("it should be able to compare two full names with the same value", () => {
  const nameA = FullName.create("Victor Carvalho");
  const nameB = FullName.create("victor CARvalho");

  if (nameA.isLeft() || nameB.isLeft()) throw new Error("setup failed");

  expect(nameA.value.equals(nameB.value)).toBe(true);
});

test("it should be able to compare two full names with different values", () => {
  const nameA = FullName.create("Victor Carvalho");
  const nameB = FullName.create("Maria Silva");

  if (nameA.isLeft() || nameB.isLeft()) throw new Error("setup failed");

  expect(nameA.value.equals(nameB.value)).toBe(false);
});
