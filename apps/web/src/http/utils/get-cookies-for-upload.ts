export function getCookiesForUpload(headers?: HeadersInit) {
  const outgoingHeaders = new Headers()

  const incomingHeaders = new Headers(headers)
  const cookies = incomingHeaders.get('cookie')

  if (cookies) {
    outgoingHeaders.set('cookie', cookies)
  }

  return outgoingHeaders
}
