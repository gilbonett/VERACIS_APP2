import { Validate } from './validate'

it('should validate a valid SSN', () => {
  const validSsn = '58450388040'
  expect(Validate.isValidSsn(validSsn)).toBe(true)
})

it('should invalidate an SSN with incorrect length', () => {
  const invalidSsn = '123456789'
  expect(Validate.isValidSsn(invalidSsn)).toBe(false)
})

it('should invalidate an SSN with all identical digits', () => {
  const invalidSsn = '11111111111'
  expect(Validate.isValidSsn(invalidSsn)).toBe(false)
})

it('should invalidate an SSN with incorrect check digits', () => {
  const invalidSsn = '58450388041'
  expect(Validate.isValidSsn(invalidSsn)).toBe(false)
})

it('should invalidate an SSN with non-numeric characters', () => {
  const invalidSsn = '58450A88040'
  expect(Validate.isValidSsn(invalidSsn)).toBe(false)
})
