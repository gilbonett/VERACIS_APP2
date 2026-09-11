import { expect, test } from 'vitest'
import { Coordinate } from './coordinate'
import { CoordinateInvalidError } from './errors/coordinate-invalid-error'

test('it should be able to create a valid coordinate', () => {
  const result = Coordinate.create(-15.7942, -47.8822)

  expect(result.isRight()).toBe(true)
  if (result.isRight()) {
    expect(result.value.getLat()).toBe(-15.7942)
    expect(result.value.getLng()).toBe(-47.8822)
  }
})

test('it should accept boundary values (±90 lat, ±180 lng)', () => {
  expect(Coordinate.create(90, 180).isRight()).toBe(true)
  expect(Coordinate.create(-90, -180).isRight()).toBe(true)
})

test('it should reject out-of-range lat/lng with CoordinateInvalidError', () => {
  const result = Coordinate.create(91, 0)

  expect(result.isLeft()).toBe(true)
  if (result.isLeft()) {
    expect(result.value).toBeInstanceOf(CoordinateInvalidError)
    expect(result.value.message).toContain('lat=91')
  }

  expect(Coordinate.create(0, 181).isLeft()).toBe(true)
  expect(Coordinate.create(-91, 0).isLeft()).toBe(true)
  expect(Coordinate.create(0, -181).isLeft()).toBe(true)
})

test('it should reject non-finite lat/lng', () => {
  expect(Coordinate.create(NaN, 0).isLeft()).toBe(true)
  expect(Coordinate.create(0, Infinity).isLeft()).toBe(true)
})
