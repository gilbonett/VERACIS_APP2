import 'server-only'
import { cookies } from 'next/headers'
import { CookieOptions, DEFAULT_COOKIE_OPTIONS } from './options'

export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  const cookieStore = await cookies()

  const optionsWithDefaults = { ...options, ...DEFAULT_COOKIE_OPTIONS }

  cookieStore.set(name, value, optionsWithDefaults)
}
