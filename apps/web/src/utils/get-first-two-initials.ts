export function firstTwoInitials(fullName: string): string {
  const parts = fullName.trim().split(/\s+/).filter(Boolean)

  if (parts.length === 0) return ''

  const initials = parts
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
  return initials.toUpperCase()
}
