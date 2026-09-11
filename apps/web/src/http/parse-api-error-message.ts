/**
 * Extrai mensagem legível do JSON de erro da API Nest (BadRequest, filtros, etc.).
 * Esse filtro zera usaado para extrair a mensagem de errro de resposta da API.
 */
export function messageFromApiErrorJson(body: unknown): string | null {
  if (body === null || body === undefined) return null
  if (typeof body === 'string') {
    const t = body.trim()
    return t.length > 0 ? t : null
  }
  if (typeof body !== 'object') return null
  const o = body as Record<string, unknown>

  const msg = o.message
  if (typeof msg === 'string' && msg.trim()) return msg.trim()
  if (Array.isArray(msg)) {
    const parts = msg
      .map((item) => (typeof item === 'string' ? item : JSON.stringify(item)))
      .filter((s) => s.length > 0)
    if (parts.length > 0) return parts.join(', ')
  }

  if (msg && typeof msg === 'object' && msg !== null) {
    const nested = msg as Record<string, unknown>
    if (typeof nested.message === 'string' && nested.message.trim()) {
      return nested.message.trim()
    }
  }

  const errors = o.errors
  if (typeof errors === 'string' && errors.trim()) return errors.trim()
  if (errors && typeof errors === 'object' && errors !== null) {
    const e = errors as Record<string, unknown>
    if (typeof e.message === 'string' && e.message.trim()) {
      return e.message.trim()
    }
  }

  if (typeof o.error === 'string' && o.error.trim()) return o.error.trim()

  return null
}

export function isAlertReactionAlreadyExistsMessage(message: string): boolean {
  const t = message.toLowerCase()
  return t.includes('reação já existe') || t.includes('reacao ja existe')
}

export async function getApiErrorMessage(
  response: Response,
  fallback: string,
): Promise<string> {
  const text = await response.text()
  if (!text.trim()) return fallback
  try {
    const parsed = JSON.parse(text) as unknown
    const fromJson = messageFromApiErrorJson(parsed)
    if (fromJson) return fromJson
    return fallback
  } catch {
    const t = text.trim()
    if (t.length > 0 && t.length < 800) return t
    return fallback
  }
}
