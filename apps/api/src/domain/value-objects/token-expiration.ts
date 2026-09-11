export class TokenExpiration {
  private constructor(private readonly value: Date) {}

  static fromDays(days: number): TokenExpiration {
    const expirationDate = new Date(Date.now() + days * 24 * 60 * 60 * 1000)
    return new TokenExpiration(expirationDate)
  }

  static fromHours(hours: number): TokenExpiration {
    const expirationDate = new Date(Date.now() + hours * 60 * 60 * 1000)
    return new TokenExpiration(expirationDate)
  }

  static fromMinutes(minutes: number): TokenExpiration {
    const expirationDate = new Date(Date.now() + minutes * 60 * 1000)
    return new TokenExpiration(expirationDate)
  }

  static now(): TokenExpiration {
    return new TokenExpiration(new Date())
  }

  getValue(): Date {
    return this.value
  }

  isExpired(): boolean {
    return this.value < new Date()
  }

  static create(value: Date) {
    return new TokenExpiration(value)
  }
}
