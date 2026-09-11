import type { Response } from 'express'

type Cookie = {
  response: Response
  nameKey: string
  token: string
  path: string
  maxAge: number
}

export function setCookie(params: Cookie) {
  if (!process.env.NODE_ENV) {
    throw new Error('NODE_ENV is not defined')
  }

  const isProduction = process.env.NODE_ENV === 'production'

  params.response.cookie(params.nameKey, params.token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'lax',
    maxAge: params.maxAge,
    path: params.path,
  })
}
