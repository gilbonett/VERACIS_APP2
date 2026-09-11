import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'

/**
 * Header `Cookie` para encaminhar à API Nest. Usa o header bruto da requisição;
 * se vier vazio (casos raros em Route Handlers), recompõe via `cookies()` do Next.
 */
export async function getCookieHeaderForApiProxy(
  request: NextRequest,
): Promise<string> {
  const raw = request.headers.get('cookie')?.trim()
  if (raw) return raw

  const store = await cookies()
  const all = store.getAll()
  if (all.length === 0) return ''

  return all.map((c) => `${c.name}=${c.value}`).join('; ')
}
