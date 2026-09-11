import { IsValidateCoordinate } from './is-validate-coordinate'

it('should validate valid coordinates', () => {
  const lat = 45.0
  const lng = -73.0
  expect(IsValidateCoordinate.validate(lat, lng)).toBe(true)
})

it('should invalidate latitude less than -90', () => {
  const lat = -91.0
  const lng = 0.0
  expect(IsValidateCoordinate.validate(lat, lng)).toBe(false)
})

it('should invalidate latitude greater than 90', () => {
  const lat = 91.0
  const lng = 0.0
  expect(IsValidateCoordinate.validate(lat, lng)).toBe(false)
})

it('should invalidate longitude less than -180', () => {
  const lat = 0.0
  const lng = -181.0
  expect(IsValidateCoordinate.validate(lat, lng)).toBe(false)
})

it('should invalidate longitude greater than 180', () => {
  const lat = 0.0
  const lng = 181.0
  expect(IsValidateCoordinate.validate(lat, lng)).toBe(false)
})

it('should validate edge case coordinates', () => {
  expect(IsValidateCoordinate.validate(-90, -180)).toBe(true)
  expect(IsValidateCoordinate.validate(90, 180)).toBe(true)
  expect(IsValidateCoordinate.validate(0, 0)).toBe(true)
})
