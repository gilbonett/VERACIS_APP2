export interface TokenOpaquePair {
  plain: string
  hashed: string
}

export abstract class TokenOpaque {
  abstract generate(value?: string): TokenOpaquePair
}
