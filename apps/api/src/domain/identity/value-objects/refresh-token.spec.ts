import { InvalidRefreshTokenError } from '../errors/invalid-refresh-token-error'
import { RefreshToken } from './refresh-token'

describe('RefreshToken.parse', () => {
  it('parses a valid token', () => {
    const result = RefreshToken.parse('session-123.0.deadbeef')

    expect(result.isRight()).toBe(true)
    if (result.isRight()) {
      expect(result.value.sessionId).toBe('session-123')
      expect(result.value.generation).toBe(0)
      expect(result.value.secret).toBe('deadbeef')
    }
  })

  it('parses a large valid generation', () => {
    const result = RefreshToken.parse('sid.42.secret')
    expect(result.isRight()).toBe(true)
    if (result.isRight()) expect(result.value.generation).toBe(42)
  })

  it.each([
    ['', 'empty'],
    ['1', 'one part'],
    ['1.2', 'two parts'],
    ['1.2.', 'empty secret'],
    ['.2.secret', 'empty sessionId'],
    ['sid..secret', 'empty generation'],
    ['sid.abc.secret', 'non-numeric generation'],
    ['sid.-1.secret', 'negative generation'],
    ['sid.1.5.secret', 'four parts / decimal'],
    ['sid.1e3.secret', 'exponent notation'],
    ['sid. 1.secret', 'leading space'],
    ['sid.99999999999999999999.secret', 'unsafe integer'],
  ])('rejects %s (%s)', (raw) => {
    const result = RefreshToken.parse(raw)
    expect(result.isLeft()).toBe(true)
    if (result.isLeft()) {
      expect(result.value).toBeInstanceOf(InvalidRefreshTokenError)
    }
  })
})
