export function maskEmail(email: string): string {
  const [localPart, domain] = email.split('@')
  if (!domain) return email

  const maskedLocal =
    localPart.length > 2
      ? `${localPart[0]}${'*'.repeat(Math.min(localPart.length - 2, 5))}${localPart[localPart.length - 1]}`
      : localPart

  return `${maskedLocal}@${domain}`
}
