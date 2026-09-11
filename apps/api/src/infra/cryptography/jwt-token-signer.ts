import { TokenPayload, TokenSigner } from "@/domain/cryptography/token-signer";
import { Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { randomUUID } from "node:crypto";

@Injectable()
export class JwtTokenSigner implements TokenSigner {
  constructor(private jwtService: JwtService) {}

  sign(payload: TokenPayload): Promise<string> {
    return this.jwtService.signAsync(payload, {
      jwtid: randomUUID(),
    });
  }

  verify(token: string): Promise<TokenPayload> {
    return this.jwtService.verifyAsync(token);
  }

  async decode(token: string): Promise<TokenPayload> {
    return this.jwtService.decode(token);
  }
}
