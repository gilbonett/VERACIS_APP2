import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { EnvService } from "@/infra/env/env.service";
import { UnauthorizedException } from "@nestjs/common";
import { makeSession } from "../../../../test/factories/make-session";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { JwtStrategy, UserPayload } from "./jwt.strategy";

const fakeEnv = {
  get: () => Buffer.from("test-public-key").toString("base64"),
} as unknown as EnvService;

function payloadFor(sid: string): UserPayload {
  return {
    sub: new UniqueEntityID().toString(),
    sid,
    aal: "LOW",
    roles: [],
  };
}

describe("JwtStrategy.validate", () => {
  let repo: InMemorySessionRepository;
  let sut: JwtStrategy;

  beforeEach(() => {
    repo = new InMemorySessionRepository();
    sut = new JwtStrategy(fakeEnv, repo);
  });

  it("returns the payload when the session is active", async () => {
    const session = makeSession();
    repo.items.push(session);

    const payload = payloadFor(session.id.toString());
    await expect(sut.validate(payload)).resolves.toEqual(payload);
  });

  it("rejects when the session does not exist", async () => {
    await expect(
      sut.validate(payloadFor(new UniqueEntityID().toString())),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it("rejects when the session is revoked", async () => {
    const session = makeSession();
    session.revoke();
    repo.items.push(session);

    await expect(
      sut.validate(payloadFor(session.id.toString())),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });
});
