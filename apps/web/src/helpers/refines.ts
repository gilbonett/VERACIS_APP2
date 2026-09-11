/**
 * Valida se a pessoa tem 18 anos ou mais
 * @param dateString - Data no formato DD/MM/AAAA
 * @returns true se tem 18 anos ou mais, false caso contrário
 */
export function isAgeValid(dateString: string): boolean {
  const cleanDate = dateString.replace(/\D/g, '')

  if (cleanDate.length !== 8) return false

  const day = parseInt(cleanDate.substring(0, 2), 10)
  const month = parseInt(cleanDate.substring(2, 4), 10)
  const year = parseInt(cleanDate.substring(4, 8), 10)

  if (month < 1 || month > 12 || day < 1 || day > 31) return false

  const daysInMonth = [
    31,
    (year % 4 === 0 && year % 100 !== 0) || year % 400 === 0 ? 29 : 28,
    31,
    30,
    31,
    30,
    31,
    31,
    30,
    31,
    30,
    31,
  ]
  if (day > daysInMonth[month - 1]) return false

  const birthDate = new Date(year, month - 1, day)

  if (
    birthDate.getDate() !== day ||
    birthDate.getMonth() !== month - 1 ||
    birthDate.getFullYear() !== year
  ) {
    return false
  }

  const today = new Date()

  if (birthDate > today) return false

  let age = today.getFullYear() - birthDate.getFullYear()
  const monthDiff = today.getMonth() - birthDate.getMonth()

  if (
    monthDiff < 0 ||
    (monthDiff === 0 && today.getDate() < birthDate.getDate())
  ) {
    age--
  }

  return age >= 18
}

export function isCpfValid(value: string): boolean {
  const ssn = value.replace(/\D/g, '')

  if (!/^\d{11}$/.test(ssn)) return false

  if (/^(\d)\1{10}$/.test(ssn)) return false

  const ssnArray = ssn.split('').map(Number)

  for (let j = 9; j < 11; j++) {
    let sum = 0
    for (let i = 0; i < j; i++) {
      sum += ssnArray[i] * (j + 1 - i)
    }
    const checkDigit = ((sum * 10) % 11) % 10
    if (checkDigit !== ssnArray[j]) return false
  }

  return true
}
