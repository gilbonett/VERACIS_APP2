import 'server-only'

import { cookies } from 'next/headers'
import type { NextRequest } from 'next/server'
import { NextResponse } from 'next/server'
import { attemptRefreshToken } from './attempt-refresh-token'
import { COOKIE_NAMES } from './cookies/options'
import { parseSetCookie } from './utils/parse-set-cookie'

function parseJsonBody(raw: string): unknown {
  const trimmed = raw.trim()
  if (!trimmed) {
    return { message: 'Resposta vazia do servidor.' }
  }
  try {
    return JSON.parse(trimmed) as unknown
  } catch {
    return { message: 'Resposta inválida do servidor.' }
  }
}

async function getForwardCookieHeader(request: NextRequest): Promise<string> {
  const fromHeader = request.headers.get('cookie')?.trim()
  if (fromHeader) {
    return fromHeader
  }

  const jar = await cookies()
  const all = jar.getAll()
  if (all.length === 0) {
    return ''
  }
  return all.map((c) => `${c.name}=${c.value}`).join('; ')
}

function cookieHeaderToMap(header: string): Map<string, string> {
  const m = new Map<string, string>()
  if (!header.trim()) {
    return m
  }
  for (const part of header.split(';')) {
    const trimmed = part.trim()
    const eq = trimmed.indexOf('=')
    if (eq === -1) {
      continue
    }
    const name = trimmed.slice(0, eq).trim()
    const value = trimmed.slice(eq + 1).trim()
    m.set(name, value)
  }
  return m
}

function mapToCookieHeader(map: Map<string, string>): string {
  return [...map.entries()].map(([k, v]) => `${k}=${v}`).join('; ')
}

function mergeCookiesFromRefresh(
  previousCookieHeader: string,
  refreshResponse: Response,
): string {
  const map = cookieHeaderToMap(previousCookieHeader)
  const setCookieFn = refreshResponse.headers.getSetCookie?.bind(
    refreshResponse.headers,
  )
  const setCookies = setCookieFn?.() ?? []
  for (const raw of setCookies) {
    const p = parseSetCookie(raw)
    if (
      !p ||
      (p.name !== COOKIE_NAMES.SESSION_TOKEN &&
        p.name !== COOKIE_NAMES.SESSION_TOKEN)
    ) {
      continue
    }
    const lower = raw.toLowerCase()
    if (lower.includes('max-age=0')) {
      map.delete(p.name)
    } else {
      map.set(p.name, p.value)
    }
  }
  return mapToCookieHeader(map)
}

export type SessionAwareApiProxyOptions = {
  request: NextRequest
  apiPathForLog: string
  buildApiUrl: () => URL
  method: string
  body?: string
  connectErrorMessage: string
}

export async function forwardJsonWithSessionToApi({
  request,
  apiPathForLog,
  buildApiUrl,
  method,
  body,
  connectErrorMessage,
}: SessionAwareApiProxyOptions): Promise<NextResponse> {
  const targetUrl = buildApiUrl()
  let cookieHeader = await getForwardCookieHeader(request)

  const fetchOnce = async (cookie: string) => {
    const headers: Record<string, string> = { Cookie: cookie }
    if (method !== 'GET' && body !== undefined) {
      headers['Content-Type'] = 'application/json'
    }
    return fetch(targetUrl, {
      method,
      headers,
      body: method !== 'GET' && body !== undefined ? body : undefined,
      cache: 'no-store',
    })
  }

  let apiResponse: Response

  try {
    apiResponse = await fetchOnce(cookieHeader)
  } catch (cause) {
    console.error(
      `[${apiPathForLog}] Falha ao contatar a API:`,
      targetUrl.origin,
      cause,
    )
    return NextResponse.json({ message: connectErrorMessage }, { status: 503 })
  }

  if (apiResponse.status === 401) {
    const refreshHeaders = new Headers()
    if (cookieHeader) {
      refreshHeaders.set('cookie', cookieHeader)
    }
    const refreshRes = await attemptRefreshToken(refreshHeaders)

    if (refreshRes.ok) {
      cookieHeader = mergeCookiesFromRefresh(cookieHeader, refreshRes)
      try {
        apiResponse = await fetchOnce(cookieHeader)
      } catch (cause) {
        console.error(
          `[${apiPathForLog}] Falha ao contatar a API após refresh:`,
          targetUrl.origin,
          cause,
        )
        return NextResponse.json(
          { message: connectErrorMessage },
          { status: 503 },
        )
      }

      const rawBody = await apiResponse.text()
      const data = parseJsonBody(rawBody)
      const res = NextResponse.json(data, { status: apiResponse.status })
      const setCookieFn = refreshRes.headers.getSetCookie?.bind(
        refreshRes.headers,
      )
      for (const h of setCookieFn?.() ?? []) {
        res.headers.append('set-cookie', h)
      }
      return res
    }
  }

  const rawBody = await apiResponse.text()
  const data = parseJsonBody(rawBody)
  return NextResponse.json(data, { status: apiResponse.status })
}

export type SessionAwareMultipartProxyOptions = {
  request: NextRequest
  apiPathForLog: string
  buildApiUrl: () => URL
  connectErrorMessage: string
}

export async function forwardMultipartPostWithSessionToApi({
  request,
  apiPathForLog,
  buildApiUrl,
  connectErrorMessage,
}: SessionAwareMultipartProxyOptions): Promise<NextResponse> {
  const targetUrl = buildApiUrl()
  const contentType = request.headers.get('content-type')
  if (!contentType?.toLowerCase().includes('multipart/form-data')) {
    return NextResponse.json(
      { message: 'Envie o corpo como multipart/form-data.' },
      { status: 400 },
    )
  }

  let body: ArrayBuffer
  try {
    body = await request.arrayBuffer()
  } catch (cause) {
    console.error(`[${apiPathForLog}] Falha ao ler multipart:`, cause)
    return NextResponse.json(
      { message: 'Corpo da requisição indisponível.' },
      { status: 400 },
    )
  }

  if (body.byteLength === 0) {
    return NextResponse.json(
      { message: 'Corpo da requisição vazio.' },
      { status: 400 },
    )
  }

  let cookieHeader = await getForwardCookieHeader(request)

  const fetchWithBufferedBody = async (cookie: string) =>
    fetch(targetUrl, {
      method: 'POST',
      headers: {
        ...(cookie ? { Cookie: cookie } : {}),
        'Content-Type': contentType,
      },
      
      body: new Uint8Array(body),
      cache: 'no-store',
    })

  let apiResponse: Response

  try {
    apiResponse = await fetchWithBufferedBody(cookieHeader)
  } catch (cause) {
    console.error(
      `[${apiPathForLog}] Falha ao contatar a API:`,
      targetUrl.origin,
      cause,
    )
    return NextResponse.json({ message: connectErrorMessage }, { status: 503 })
  }

  if (apiResponse.status === 401) {
    const refreshHeaders = new Headers()
    if (cookieHeader) {
      refreshHeaders.set('cookie', cookieHeader)
    }
    const refreshRes = await attemptRefreshToken(refreshHeaders)

    if (refreshRes.ok) {
      cookieHeader = mergeCookiesFromRefresh(cookieHeader, refreshRes)
      try {
        apiResponse = await fetchWithBufferedBody(cookieHeader)
      } catch (cause) {
        console.error(
          `[${apiPathForLog}] Falha ao contatar a API após refresh:`,
          targetUrl.origin,
          cause,
        )
        return NextResponse.json(
          { message: connectErrorMessage },
          { status: 503 },
        )
      }

      const rawBody = await apiResponse.text()
      const data = parseJsonBody(rawBody)
      const res = NextResponse.json(data, { status: apiResponse.status })
      const setCookieFn = refreshRes.headers.getSetCookie?.bind(
        refreshRes.headers,
      )
      for (const h of setCookieFn?.() ?? []) {
        res.headers.append('set-cookie', h)
      }
      return res
    }
  }

  const rawBody = await apiResponse.text()
  const data = parseJsonBody(rawBody)
  return NextResponse.json(data, { status: apiResponse.status })
}
