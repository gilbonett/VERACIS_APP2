import { CookiesFn, hasCookie as hasCookieNext } from 'cookies-next'

export async function hasCookie(name: string) {
  let cookieStore: CookiesFn | undefined

  if (typeof window === 'undefined') {
    const { cookies: serverCookies } = await import('next/headers')

    cookieStore = serverCookies
  }
  const token = await hasCookieNext(name, { cookies: cookieStore })

  return token
}
