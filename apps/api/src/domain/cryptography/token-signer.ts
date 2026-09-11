export type TokenPayload = Record<string, unknown>;

export abstract class TokenSigner {
  abstract sign(payload: TokenPayload): Promise<string>;
  abstract verify(token: string): Promise<TokenPayload>;
  abstract decode(token: string): Promise<TokenPayload>;
}
