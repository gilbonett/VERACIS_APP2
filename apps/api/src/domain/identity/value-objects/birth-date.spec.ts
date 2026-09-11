import { expect, test } from "vitest";
import { BirthDate } from "./birth-date";

test("it should be able to create a valid birth date", () => {
  const result = BirthDate.create(new Date("1990-01-01"));

  expect(result.isRight()).toBe(true);
});

test("it should not create a birth date in the future", () => {
  const future = new Date();
  future.setFullYear(future.getFullYear() + 1);

  const result = BirthDate.create(future);

  expect(result.isLeft()).toBe(true);
});

test("it should not create an invalid date", () => {
  const result = BirthDate.create(new Date("invalid"));

  expect(result.isLeft()).toBe(true);
});

test("it should be able to compare two birth dates with the same value", () => {
  const dateA = BirthDate.create(new Date("1990-01-01"));
  const dateB = BirthDate.create(new Date("1990-01-01"));

  if (dateA.isLeft() || dateB.isLeft()) throw new Error("setup failed");

  expect(dateA.value.equals(dateB.value)).toBe(true);
});

test("it should be able to compare two birth dates with different values", () => {
  const dateA = BirthDate.create(new Date("1990-01-01"));
  const dateB = BirthDate.create(new Date("1991-06-15"));

  if (dateA.isLeft() || dateB.isLeft()) throw new Error("setup failed");

  expect(dateA.value.equals(dateB.value)).toBe(false);
});
