export class Validate {
  static isValidSsn(value: string): boolean {
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

  static isValidEmail(email: string): boolean {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    return emailRegex.test(email)
  }

  static isValidPassword(password: string): string | undefined {
    if (password.length < 8) {
      return 'Password must be at least 8 characters long.'
    }

    if (!/[A-Z]/.test(password)) {
      return 'Password must contain at least one uppercase letter.'
    }

    if (!/[a-z]/.test(password)) {
      return 'Password must contain at least one lowercase letter.'
    }

    if (!/[0-9]/.test(password)) {
      return 'Password must contain at least one digit.'
    }

    if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
      return 'Password must contain at least one special character.'
    }
  }
}
