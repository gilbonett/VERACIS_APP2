import { Either, left, right } from '@/core/either'
import { Validate } from '@/core/validations/validate'

import { CpfBadValidError } from './errors/cpf-bad-valid-error'

export class CPF {
  protected constructor(private readonly cpf: string) {}

  get value(): string {
    return this.cpf
  }

  static validate(cpf: string): boolean {
    return Validate.isValidSsn(cpf)
  }

  static create(cpf: string): Either<CpfBadValidError, CPF> {
    const isValidCpf = CPF.validate(cpf)

    if (!isValidCpf) {
      return left(new CpfBadValidError(cpf))
    }

    return right(new CPF(cpf))
  }
}
