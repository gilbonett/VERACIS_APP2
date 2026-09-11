import {
  TokenOpaque,
  type TokenOpaquePair,
} from '@/domain/cryptography/token-opaque'
import { Injectable } from '@nestjs/common'
import { createHmac, randomBytes } from 'node:crypto'
import { EnvService } from '../env/env.service'

@Injectable()
export class HmacTokenOpaque implements TokenOpaque {
  constructor(private env: EnvService) {}

  generate(value?: string): TokenOpaquePair {
    const plain = value ?? randomBytes(32).toString('hex')

    const secret = this.env.get('TOKEN_SECRET_KEY')

    const hashed = createHmac('sha256', secret).update(plain).digest('hex')

    return { plain, hashed }
  }
}
