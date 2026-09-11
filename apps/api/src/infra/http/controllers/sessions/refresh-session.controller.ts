import { RefreshSessionUseCase } from '@/application/use-cases/identity/refresh-session-use-case'
import { CurrentRefreshToken } from '@/infra/auth/decorators/current-refresh-token'
import { SessionGuard } from '@/infra/auth/guards/session.guard'
import { Public } from '@/infra/auth/jwt/public'
import { EnvService } from '@/infra/env/env.service'
import { SWAGGER_TAGS } from '@/infra/swagger/swagger-tags'
import {
  Controller,
  Ip,
  Post,
  Res,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import type { Response } from 'express'
import { setAuthCookies } from '../../cookies/auth-cookies'

@Public()
@ApiTags(SWAGGER_TAGS.SESSION)
@Controller('session/refresh')
export class RefreshSessionController {
  constructor(
    private refreshSessionUseCase: RefreshSessionUseCase,
    private env: EnvService,
  ) {}

  @Post()
  @UseGuards(SessionGuard)
  async handle(
    @Ip() ipAddress: string,
    @Res({ passthrough: true }) response: Response,
    @CurrentRefreshToken() refreshToken: string,
  ) {
    const result = await this.refreshSessionUseCase.execute({
      refreshToken,
      ipAddress,
    })

    if (result.isLeft()) {
      throw new UnauthorizedException()
    }

    const tokens = result.value
    const domain = this.env.get('COOKIE_DOMAIN')

    setAuthCookies(response, tokens, domain)

    return { success: true, message: 'Session refreshed successfully!' }
  }
}
