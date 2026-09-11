import { SessionRepository } from "@/domain/identity/repositories/session-repository";
import { EnvService } from "@/infra/env/env.service";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { Request } from "express";
import { ExtractJwt, Strategy } from "passport-jwt";
import z from "zod";
import { extractTokenFromCookies } from "../extracts/extract-token-from-cookies";

const tokenPayloadSchema = z.object({
  sub: z.uuid(),
  sid: z.uuid(),
  aal: z.enum(["LOW", "MEDIUM", "HIGH"]),
  roles: z.array(
    z.object({
      roleId: z.string(),
      scopeType: z.string().nullable(),
      scopeValue: z.string().nullable(),
    }),
  ),
});

export type UserPayload = z.infer<typeof tokenPayloadSchema>;

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    protected readonly env: EnvService,
    private readonly sessionRepository: SessionRepository,
  ) {
    const publicKey = env.get("JWT_PUBLIC_KEY");

    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        ExtractJwt.fromAuthHeaderAsBearerToken(),
        (req: Request) => extractTokenFromCookies(req, "veracis.access_token"),
      ]),
      secretOrKey: Buffer.from(publicKey, "base64"),
      algorithms: ["RS256"],
      issuer: "veracis-api",
      audience: "veracis-web",
    });
  }

  async validate(payload: UserPayload): Promise<UserPayload> {
    const parsed = tokenPayloadSchema.parse(payload);

    const session = await this.sessionRepository.findById(parsed.sid);

    if (!session || session.isRevoked || session.isExpired) {
      throw new UnauthorizedException();
    }

    return parsed;
  }
}
