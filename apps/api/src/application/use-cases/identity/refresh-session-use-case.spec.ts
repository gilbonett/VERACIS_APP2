import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserRoleAssignment } from "@/domain/authorization/entities/user-role-assignment";
import { ConcurrentRefreshError } from "@/domain/identity/errors/concurrent-refresh-error";
import { InvalidRefreshTokenError } from "@/domain/identity/errors/invalid-refresh-token-error";
import { TokenReuseDetectedError } from "@/domain/identity/errors/token-reuse-detected-error";
import { TooManyRefreshAttemptsError } from "@/domain/identity/errors/too-many-refresh-attempts-error";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { FakeTokenSigner } from "../../../../test/cryptography/fake-token-signer";
import { makeSession } from "../../../../test/factories/make-session";
import { makeSessionToken } from "../../../../test/factories/make-session-token";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { InMemorySessionTokenRepository } from "../../../../test/repositories/in-memory-session-token-repository";
import { InMemoryUserRoleAssignmentRepository } from "../../../../test/repositories/in-memory-user-role-assignment-repository";
import { FakeRateLimiterStore } from "../../../../test/stores/fake-rate-limiter-store";
import { FakeRefreshLockStore } from "../../../../test/stores/fake-refresh-lock-store";
import { RefreshSessionUseCase } from "./refresh-session-use-case";

let sut: RefreshSessionUseCase;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemorySessionTokenRepository: InMemorySessionTokenRepository;
let inMemoryUserRoleAssignmentRepository: InMemoryUserRoleAssignmentRepository;
let fakeTokenOpaque: FakeTokenOpaque;
let fakeTokenSigner: FakeTokenSigner;
let fakeRateLimiterStore: FakeRateLimiterStore;
let fakeRefreshLockStore: FakeRefreshLockStore;

const SECRET = "current-secret";
const IP_ADDRESS = "127.0.0.1";

async function seedSessionWithToken({
  userId = new UniqueEntityID(),
  version = 0,
  authenticatedAt = new Date(),
  expiresAt = new Date(Date.now() + 60 * 60 * 1000),
}: {
  userId?: UniqueEntityID;
  version?: number;
  authenticatedAt?: Date;
  expiresAt?: Date;
} = {}) {
  const session = makeSession({ userId, authenticatedAt, expiresAt });
  inMemorySessionRepository.items.push(session);

  const token = makeSessionToken({
    sessionId: session.id,
    version,
    tokenHash: fakeTokenOpaque.generate(SECRET).hashed,
  });
  inMemorySessionTokenRepository.items.push(token);

  return session;
}

describe("Refresh Session Use Case", () => {
  beforeEach(() => {
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemorySessionTokenRepository = new InMemorySessionTokenRepository();
    inMemoryUserRoleAssignmentRepository =
      new InMemoryUserRoleAssignmentRepository();
    fakeTokenOpaque = new FakeTokenOpaque();
    fakeTokenSigner = new FakeTokenSigner();
    fakeRateLimiterStore = new FakeRateLimiterStore();
    fakeRefreshLockStore = new FakeRefreshLockStore();

    sut = new RefreshSessionUseCase(
      inMemorySessionRepository,
      inMemorySessionTokenRepository,
      inMemoryUserRoleAssignmentRepository,
      fakeTokenOpaque,
      fakeTokenSigner,
      fakeRateLimiterStore,
      fakeRefreshLockStore,
    );
  });

  it("should not refresh when rate limit is exceeded", async () => {
    fakeRateLimiterStore.deniedKeys.add(`refresh:ip:${IP_ADDRESS}`);

    const result = await sut.execute({
      refreshToken: "anything",
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(TooManyRefreshAttemptsError);
  });

  it("should not refresh an unknown token", async () => {
    const result = await sut.execute({
      refreshToken: "unknown-secret",
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("should not refresh when the session is already revoked", async () => {
    const session = await seedSessionWithToken();
    session.revoke();
    await inMemorySessionRepository.save(session);

    const result = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
  });

  it("should not refresh when the session is expired", async () => {
    await seedSessionWithToken({
      expiresAt: new Date(Date.now() - 1000),
    });

    const result = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
  });

  describe("when the token has already been consumed (reuse)", () => {
    let session: Awaited<ReturnType<typeof seedSessionWithToken>>;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      session = await seedSessionWithToken({ version: 0 });
      inMemorySessionTokenRepository.items[0].consume(1);

      result = await sut.execute({
        refreshToken: SECRET,
        ipAddress: IP_ADDRESS,
      });
    });

    it("should return a TokenReuseDetectedError", () => {
      expect(result.isLeft()).toBe(true);
      expect(result.value).toBeInstanceOf(TokenReuseDetectedError);
    });

    it("should revoke the session with reason TOKEN_REUSE", () => {
      expect(inMemorySessionRepository.items[0].isRevoked).toBe(true);
      expect(inMemorySessionRepository.items[0].revokeReason).toBe(
        "TOKEN_REUSE",
      );
      expect(session.id.toString()).toBe(
        inMemorySessionRepository.items[0].id.toString(),
      );
    });
  });

  it("should fail WITHOUT revoking when the fail-fast lock is already held", async () => {
    const session = await seedSessionWithToken({ version: 0 });
    fakeRefreshLockStore.deniedSessionIds.add(session.id.toString());

    const result = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConcurrentRefreshError);
    expect(inMemorySessionRepository.items[0].isRevoked).toBe(false);
  });

  it("should reject the refresh if the session was revoked between the initial read and acquiring the lock", async () => {
    const session = await seedSessionWithToken({ version: 0 });

    // Simulates another actor (e.g. an admin action or a password change)
    // revoking the session in the window between the pre-lock read and the
    // lock being granted. The use case must catch this via its refetch
    // inside the lock, not trust the pre-lock snapshot.
    const originalAcquire =
      fakeRefreshLockStore.acquire.bind(fakeRefreshLockStore);
    vi.spyOn(fakeRefreshLockStore, "acquire").mockImplementationOnce(
      async (sessionId) => {
        session.revoke(new Date(), "ADMIN_REVOKED");
        await inMemorySessionRepository.save(session);
        return originalAcquire(sessionId);
      },
    );

    const result = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(InvalidRefreshTokenError);
    expect(inMemorySessionTokenRepository.items[0].isConsumed).toBe(false);
    expect(inMemorySessionTokenRepository.items).toHaveLength(1);
  });

  it("should fail WITHOUT revoking when rotate() loses an atomic CAS race", async () => {
    await seedSessionWithToken({ version: 0 });
    vi.spyOn(inMemorySessionTokenRepository, "rotate").mockResolvedValueOnce(
      false,
    );

    const result = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(ConcurrentRefreshError);
    expect(inMemorySessionRepository.items[0].isRevoked).toBe(false);
  });

  it("should NOT consume the old refresh token if a downstream failure happens after the lock (e.g. signing fails), so a retry still works", async () => {
    await seedSessionWithToken({ version: 0 });

    vi.spyOn(fakeTokenSigner, "sign").mockRejectedValueOnce(
      new Error("signer unavailable"),
    );

    await expect(
      sut.execute({ refreshToken: SECRET, ipAddress: IP_ADDRESS }),
    ).rejects.toThrow("signer unavailable");

    // The old token must still be usable: nothing was mutated before the
    // failure, since rotate() only runs after resolveRoleClaims + sign.
    expect(inMemorySessionTokenRepository.items).toHaveLength(1);
    expect(inMemorySessionTokenRepository.items[0].isConsumed).toBe(false);
    expect(inMemorySessionRepository.items[0].isRevoked).toBe(false);

    const retry = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(retry.isRight()).toBe(true);
    expect(inMemorySessionRepository.items[0].isRevoked).toBe(false);
  });

  it("should let only one of two concurrent refreshes with the same token win", async () => {
    await seedSessionWithToken({ version: 0 });

    const [a, b] = await Promise.all([
      sut.execute({ refreshToken: SECRET, ipAddress: IP_ADDRESS }),
      sut.execute({ refreshToken: SECRET, ipAddress: IP_ADDRESS }),
    ]);

    const wins = [a, b].filter((r) => r.isRight()).length;
    expect(wins).toBe(1);
    expect(inMemorySessionRepository.items[0].isRevoked).toBe(false);
  });

  describe("when the refresh succeeds", () => {
    const userId = new UniqueEntityID("user-01");
    const roleId = new UniqueEntityID("role-01");
    let session: Awaited<ReturnType<typeof seedSessionWithToken>>;
    let before: number;
    let after: number;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      session = await seedSessionWithToken({ userId, version: 0 });

      inMemoryUserRoleAssignmentRepository.items.push(
        UserRoleAssignment.create({
          userId,
          roleId,
          scopeType: "communityId",
          scopeValue: "community-01",
          assignedByUserId: null,
          assignedAt: new Date(),
        }),
      );

      before = Date.now();
      result = await sut.execute({
        refreshToken: SECRET,
        ipAddress: IP_ADDRESS,
      });
      after = Date.now();
    });

    it("should return success", () => {
      expect(result.isRight()).toBe(true);
    });

    it("should bump the session's lastActivityAt within the execution window", () => {
      const persistedSession = inMemorySessionRepository.items[0];
      expect(persistedSession.lastActivityAt.getTime()).toBeGreaterThanOrEqual(
        before,
      );
      expect(persistedSession.lastActivityAt.getTime()).toBeLessThanOrEqual(
        after,
      );
    });

    it("should extend the session's expiration past its authenticatedAt", () => {
      const persistedSession = inMemorySessionRepository.items[0];
      expect(persistedSession.expiresAt.getTime()).toBeGreaterThan(
        session.authenticatedAt.getTime(),
      );
    });

    it("should consume the old refresh token and persist a new one at the next version", () => {
      if (result.isLeft()) throw new Error("expected right");
      expect(inMemorySessionTokenRepository.items[0].isConsumed).toBe(true);
      expect(inMemorySessionTokenRepository.items[1].version).toBe(1);
      expect(inMemorySessionTokenRepository.items[1].tokenHash).toBe(
        fakeTokenOpaque.generate(result.value.refreshToken).hashed,
      );
    });

    it("should sign the access token with freshly resolved roles", () => {
      if (result.isLeft()) throw new Error("expected right");
      const payload = JSON.parse(result.value.accessToken);
      expect(payload.roles).toEqual([
        {
          roleId: roleId.toString(),
          scopeType: "communityId",
          scopeValue: "community-01",
        },
      ]);
    });
  });

  it("should not extend expiration past the absolute lifetime ceiling", async () => {
    const authenticatedAt = new Date(Date.now() - 89 * 24 * 60 * 60 * 1000);
    const session = await seedSessionWithToken({
      authenticatedAt,
      expiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });

    const result = await sut.execute({
      refreshToken: SECRET,
      ipAddress: IP_ADDRESS,
    });

    expect(result.isRight()).toBe(true);

    const absoluteCeiling =
      authenticatedAt.getTime() + 90 * 24 * 60 * 60 * 1000;
    const rollingWithoutCap = Date.now() + 30 * 24 * 60 * 60 * 1000;

    const persisted = inMemorySessionRepository.items[0];
    expect(persisted.expiresAt.getTime()).toBeLessThanOrEqual(
      absoluteCeiling + 1000,
    );
    expect(persisted.expiresAt.getTime()).toBeLessThan(rollingWithoutCap);
    expect(session.id.toString()).toBe(persisted.id.toString());
  });
});
