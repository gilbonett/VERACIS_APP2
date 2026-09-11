export function getCookiesFromHeaders(headers?: HeadersInit) {
  const outgoingHeaders = new Headers()

  const incomingHeaders = new Headers(headers)
  const cookies = incomingHeaders.get('cookie')

  outgoingHeaders.set('Content-Type', 'application/json')

  if (cookies) {
    outgoingHeaders.set('cookie', cookies)
  }

  return outgoingHeaders
}
