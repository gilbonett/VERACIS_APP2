export class Severity {
  private value: string

  toString() {
    return this.value
  }

  constructor(value: string) {
    const replace = {
      LOW: 'BAIXO',
      MEDIUM: 'MEDIO',
      HIGH: 'ALTO',
      VERY_HIGH: 'CRITICO',
      DEFAULT: 'DEFAULT',
    }
    this.value = replace[value as keyof typeof replace]
  }
}
