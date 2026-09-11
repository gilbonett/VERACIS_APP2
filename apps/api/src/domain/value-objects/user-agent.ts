export class UserAgent {
  private constructor(private readonly value: string) {}

  static create(userAgent: string | undefined | null): UserAgent {
    const normalized = UserAgent.normalize(userAgent)
    return new UserAgent(normalized)
  }

  private static normalize(userAgent: string | undefined | null): string {
    if (!userAgent || userAgent.trim() === '') {
      return 'Unknown'
    }

    return userAgent.trim()
  }

  getValue(): string {
    return this.value
  }

  isUnknown(): boolean {
    return this.value === 'Unknown'
  }

  isMobile(): boolean {
    const mobileRegex =
      /Mobile|Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i
    return mobileRegex.test(this.value)
  }

  isDesktop(): boolean {
    return !this.isMobile() && !this.isUnknown()
  }

  getBrowser(): string {
    if (this.value.includes('Chrome')) return 'Chrome'
    if (this.value.includes('Firefox')) return 'Firefox'
    if (this.value.includes('Safari')) return 'Safari'
    if (this.value.includes('Edge')) return 'Edge'
    if (this.value.includes('Opera')) return 'Opera'
    return 'Unknown'
  }

  getOS(): string {
    if (this.value.includes('Windows')) return 'Windows'
    if (this.value.includes('Mac OS')) return 'macOS'
    if (this.value.includes('Linux')) return 'Linux'
    if (this.value.includes('Android')) return 'Android'
    if (this.value.includes('iOS') || this.value.includes('iPhone'))
      return 'iOS'
    return 'Unknown'
  }

  toString(): string {
    return this.value
  }

  equals(other: UserAgent): boolean {
    return this.value === other.value
  }
}
