import { expect, test } from "vitest";
import { Cpf } from "./cpf";

test("it should be able to create a valid cpf (masked)", () => {
  const result = Cpf.create("111.444.777-35");

  expect(result.isRight()).toBe(true);
});

test("it should be able to create a valid cpf (digits only)", () => {
  const result = Cpf.create("11144477735");

  expect(result.isRight()).toBe(true);
});

test("it should not create a cpf with wrong check digits", () => {
  const result = Cpf.create("111.444.777-36");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a cpf with all repeated digits", () => {
  const result = Cpf.create("111.111.111-11");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a cpf with wrong length", () => {
  const result = Cpf.create("123.456.789");

  expect(result.isLeft()).toBe(true);
});

test("it should not create a cpf with non numeric characters left after strip", () => {
  const result = Cpf.create("abc.def.ghi-jk");

  expect(result.isLeft()).toBe(true);
});

test("it should be able to compare two cpfs with the same value", () => {
  const cpfA = Cpf.create("111.444.777-35");
  const cpfB = Cpf.create("111.444.777-35");

  if (cpfA.isLeft() || cpfB.isLeft()) throw new Error("setup failed");

  expect(cpfA.value.equals(cpfB.value)).toBe(true);
});

test("it should be able to compare the same cpf masked and unmasked as equal", () => {
  const cpfA = Cpf.create("111.444.777-35");
  const cpfB = Cpf.create("11144477735");

  if (cpfA.isLeft() || cpfB.isLeft()) throw new Error("setup failed");

  expect(cpfA.value.equals(cpfB.value)).toBe(true);
});

test("it should be able to compare two cpfs with different values", () => {
  const cpfA = Cpf.create("111.444.777-35");
  const cpfB = Cpf.create("529.982.247-25");

  if (cpfA.isLeft() || cpfB.isLeft()) throw new Error("setup failed");

  expect(cpfA.value.equals(cpfB.value)).toBe(false);
});

test("it should store the value normalized to digits only", () => {
  const result = Cpf.create("111.444.777-35");

  if (result.isLeft()) throw new Error("setup failed");

  expect(result.value.toValue()).toBe("11144477735");
});
