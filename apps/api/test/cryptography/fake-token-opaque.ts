import {
  TokenOpaque,
  TokenOpaquePair,
} from '@/domain/cryptography/token-opaque'
import { randomUUID } from 'node:crypto'

export class FakeTokenOpaque implements TokenOpaque {
  generate(value?: string): TokenOpaquePair {
    const plain = value ?? randomUUID()
    return { plain, hashed: plain.concat('-hashed') }
  }
}
