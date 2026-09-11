import { TokenPayload, TokenSigner } from "@/domain/cryptography/token-signer";

export class FakeTokenSigner implements TokenSigner {
  async sign(payload: TokenPayload): Promise<string> {
    return JSON.stringify(payload);
  }

  async verify(token: string): Promise<TokenPayload> {
    return JSON.parse(token);
  }

  async decode(token: string): Promise<TokenPayload> {
    return JSON.parse(token);
  }
}
