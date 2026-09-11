import type { ResponseCookie } from 'next/dist/compiled/@edge-runtime/cookies'
import 'server-only'

export interface ParsedCookie {
  name: string
  value: string
  options: Partial<ResponseCookie>
}

export function parseSetCookie(
  setCookieHeader: string | null,
): ParsedCookie | null {
  if (!setCookieHeader) return null

  // Separa os atributos do cookie (separados por ponto e vírgula)
  const parts = setCookieHeader.split(';').map((part) => part.trim())

  if (parts.length === 0) return null

  // O primeiro item é sempre name=value
  const [nameValuePart, ...attributeParts] = parts
  const equalIndex = nameValuePart.indexOf('=')

  if (equalIndex === -1) return null

  const name = nameValuePart.substring(0, equalIndex).trim()
  const value = nameValuePart.substring(equalIndex + 1).trim()

  // Inicializa as opções com valores padrão
  const options: Partial<ResponseCookie> = {
    path: '/',
  }

  let hasMaxAge = false
  let expiresDate: Date | null = null

  // Parseia cada atributo
  for (const attr of attributeParts) {
    const attrLower = attr.toLowerCase()
    const attrEqualIndex = attr.indexOf('=')

    if (attrEqualIndex === -1) {
      // Atributos sem valor (flags booleanas)
      if (attrLower === 'httponly') {
        options.httpOnly = true
      } else if (attrLower === 'secure') {
        options.secure = true
      }
    } else {
      // Atributos com valor
      const attrName = attr.substring(0, attrEqualIndex).trim().toLowerCase()
      const attrValue = attr.substring(attrEqualIndex + 1).trim()

      switch (attrName) {
        case 'path':
          options.path = attrValue
          break

        case 'domain':
          options.domain = attrValue
          break

        case 'max-age': {
          const maxAge = parseInt(attrValue, 10)
          if (!isNaN(maxAge)) {
            options.maxAge = maxAge
            hasMaxAge = true
          }
          break
        }

        case 'expires': {
          // Converte string de data para Date e guarda para calcular maxAge depois
          const parsedDate = new Date(attrValue)
          if (!isNaN(parsedDate.getTime())) {
            expiresDate = parsedDate
            options.expires = parsedDate
          }
          break
        }

        case 'samesite': {
          const sameSite = attrValue.toLowerCase()
          if (
            sameSite === 'strict' ||
            sameSite === 'lax' ||
            sameSite === 'none'
          ) {
            options.sameSite = sameSite
          }
          break
        }

        case 'priority': {
          const priority = attrValue.toLowerCase()
          if (
            priority === 'low' ||
            priority === 'medium' ||
            priority === 'high'
          ) {
            options.priority = priority as 'low' | 'medium' | 'high'
          }
          break
        }
      }
    }
  }

  // Se não veio Max-Age mas veio Expires, calcula o maxAge em segundos
  if (!hasMaxAge && expiresDate) {
    const nowInSeconds = Math.floor(Date.now() / 1000)
    const expiresInSeconds = Math.floor(expiresDate.getTime() / 1000)
    const calculatedMaxAge = expiresInSeconds - nowInSeconds

    // Só seta se for positivo (cookie ainda não expirado)
    if (calculatedMaxAge > 0) {
      options.maxAge = calculatedMaxAge
    }
  }

  return { name, value, options }
}
