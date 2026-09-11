import { forwardJsonWithSessionToApi } from '@/http/session-aware-api-proxy'
import { PROFILE_TAGS } from '@/http/queries/get-profile'
import { env } from '@/public-env'
import { revalidateTag } from 'next/cache'
import { NextRequest, NextResponse } from 'next/server'

const CONNECT_ERROR =
  'Não foi possível conectar ao servidor.'

export async function POST(request: NextRequest) {
  try {
    const response = await forwardJsonWithSessionToApi({
      request,
      apiPathForLog: 'api/users/me/map-tutorial/complete POST',
      buildApiUrl: () =>
        new URL('users/me/map-tutorial/complete', env.API_URL),
      method: 'POST',
      connectErrorMessage: CONNECT_ERROR,
    })

    if (response.ok) {
      revalidateTag(PROFILE_TAGS.PROFILE, 'max')
    }

    return response
  } catch (error) {
    console.error('[api/users/me/map-tutorial/complete POST]', error)
    return NextResponse.json(
      { message: 'Erro interno ao concluir tutorial do mapa.' },
      { status: 500 },
    )
  }
}
