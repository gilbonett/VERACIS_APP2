import { Either, left, right } from '@/core/either'
import { Coordinate } from '@/core/value-objects/coordinate'
import { CoordinateInvalidError } from '@/core/value-objects/errors/coordinate-invalid-error'
import { BirthDateInvalidError } from '../errors/birth-date-invalid-error'
import { CpfBadValidError } from '../errors/cpf-bad-valid-error'
import { EmailBadFormattedError } from '../errors/email-bad-formatted-error'
import { FullNameInvalidError } from '../errors/full-name-invalid-error'
import { PhoneInvalidError } from '../errors/phone-invalid-error'
import { BirthDate } from '../value-objects/birth-date'
import { Cpf } from '../value-objects/cpf'
import { Email } from '../value-objects/email'
import { FullName } from '../value-objects/full-name'
import { Phone } from '../value-objects/phone'

export type UserProfileFieldsInput = {
  name: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  latitude: number
  longitude: number
}

export type UserProfileFields = {
  name: FullName
  cpf: Cpf
  email: Email
  phone: Phone
  birthDate: BirthDate
  coordinate: Coordinate
}

export type UserProfileFieldsError =
  | CpfBadValidError
  | EmailBadFormattedError
  | PhoneInvalidError
  | BirthDateInvalidError
  | FullNameInvalidError
  | CoordinateInvalidError

export function validateUserProfileFields(
  data: UserProfileFieldsInput,
): Either<UserProfileFieldsError, UserProfileFields> {
  const cpf = Cpf.create(data.cpf)
  if (cpf.isLeft()) return left(cpf.value)

  const email = Email.create(data.email)
  if (email.isLeft()) return left(email.value)

  const phone = Phone.create(data.phone)
  if (phone.isLeft()) return left(phone.value)

  const birthDate = BirthDate.create(new Date(data.birthDate))
  if (birthDate.isLeft()) return left(birthDate.value)

  const name = FullName.create(data.name)
  if (name.isLeft()) return left(name.value)

  const coordinate = Coordinate.create(data.latitude, data.longitude)
  if (coordinate.isLeft()) return left(coordinate.value)

  return right({
    cpf: cpf.value,
    email: email.value,
    phone: phone.value,
    birthDate: birthDate.value,
    name: name.value,
    coordinate: coordinate.value,
  })
}
