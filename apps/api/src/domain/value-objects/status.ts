export class Status {
  private value: string

  toString() {
    return this.value
  }

  constructor(value: string) {
    const replace = {
      ACTIVE: 'ATIVO',
      IN_PROGRESS: 'EM PROGRESSO',
      COMPLETED: 'CONCLUIDO',
    }
    this.value = replace[value as keyof typeof replace]
  }
}
