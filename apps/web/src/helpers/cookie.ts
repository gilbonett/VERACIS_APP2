import { CookiesFn, setCookie as setCookieNext } from 'cookies-next'

type IParseSetCookie = {
  name: string
  value: string
  httpOnly: boolean
  path: string
  maxAge?: number
  sameSite: 'lax' | 'strict' | 'none'
}

export function parseSetCookie(rawCookie: string): IParseSetCookie {
  const [nameValue, ...attrs] = rawCookie.split(';').map((s) => s.trim())

  const eqIndex = nameValue.indexOf('=')
  const name = nameValue.substring(0, eqIndex)
  const value = nameValue.substring(eqIndex + 1)

  const attrsObj = Object.fromEntries(
    attrs.map((attr) => {
      const [k, v] = attr.split('=')
      return [k.toLowerCase().trim(), v?.trim() ?? true]
    }),
  )

  return {
    name,
    value,
    httpOnly: 'httponly' in attrsObj,
    path: attrsObj['path'] ?? '/',
    maxAge: attrsObj['max-age'] ? Number(attrsObj['max-age']) : undefined,
    sameSite: (attrsObj['samesite'] as 'lax' | 'strict' | 'none') ?? 'lax',
  }
}

export async function setCookie(cookie: IParseSetCookie) {
  let cookieStore: CookiesFn | undefined

  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')

    cookieStore = serverCookies
  }

  await setCookieNext(cookie.name, cookie.value, {
    cookies: cookieStore,
    secure: true,
    httpOnly: cookie.httpOnly,
    path: cookie.path,
    maxAge: cookie.maxAge,
    sameSite: cookie.sameSite,
  })
}
