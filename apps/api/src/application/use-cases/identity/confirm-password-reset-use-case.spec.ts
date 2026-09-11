import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { PasswordInvalidError } from "@/core/value-objects/errors/password-invalid-error";
import { PasswordResetChallenge } from "@/domain/identity/entities/password-reset-challenge";
import { PasswordResetTokenInvalidError } from "@/domain/identity/errors/password-reset-token-invalid-error";
import { FakeHasher } from "../../../../test/cryptography/fake-hasher";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { makeCredentialAccount } from "../../../../test/factories/make-account";
import { makeSession } from "../../../../test/factories/make-session";
import { InMemoryAccountRepository } from "../../../../test/repositories/in-memory-account-repository";
import { InMemoryPasswordResetChallengeRepository } from "../../../../test/repositories/in-memory-password-reset-challenge-repository";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { InMemorySessionTokenRepository } from "../../../../test/repositories/in-memory-session-token-repository";
import { ConfirmPasswordResetUseCase } from "./confirm-password-reset-use-case";

let sut: ConfirmPasswordResetUseCase;
let inMemoryPasswordResetChallengeRepository: InMemoryPasswordResetChallengeRepository;
let inMemoryAccountRepository: InMemoryAccountRepository;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemorySessionTokenRepository: InMemorySessionTokenRepository;
let fakeHasher: FakeHasher;
let fakeTokenOpaque: FakeTokenOpaque;

const TOKEN = "a-valid-opaque-reset-token";
const NEW_PASSWORD = "N3w-Strong-P@ssword";

function seedPendingChallenge({
  userId = new UniqueEntityID(),
  expiresAt = new Date(Date.now() + 30 * 60 * 1000),
  token = TOKEN,
}: {
  userId?: UniqueEntityID;
  expiresAt?: Date;
  token?: string;
} = {}) {
  const challenge = PasswordResetChallenge.issue({
    userId,
    tokenHash: fakeTokenOpaque.generate(token).hashed,
    ipAddress: "10.0.0.1",
    userAgent: "vitest",
    deviceName: "windows",
    expiresAt,
  });
  inMemoryPasswordResetChallengeRepository.items.push(challenge);
  return challenge;
}

describe("Confirm Password Reset Use Case", () => {
  beforeEach(() => {
    inMemoryPasswordResetChallengeRepository =
      new InMemoryPasswordResetChallengeRepository();
    inMemoryAccountRepository = new InMemoryAccountRepository();
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemorySessionTokenRepository = new InMemorySessionTokenRepository();
    fakeHasher = new FakeHasher();
    fakeTokenOpaque = new FakeTokenOpaque();

    sut = new ConfirmPasswordResetUseCase(
      inMemoryPasswordResetChallengeRepository,
      inMemoryAccountRepository,
      inMemorySessionRepository,
      inMemorySessionTokenRepository,
      fakeHasher,
      fakeTokenOpaque,
    );
  });

  it("should not confirm an unknown token", async () => {
    const result = await sut.execute({
      token: "unknown-token",
      newPassword: NEW_PASSWORD,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError);
  });

  it("should mark the challenge EXPIRED and reject when past expiresAt", async () => {
    seedPendingChallenge({ expiresAt: new Date(Date.now() - 1000) });

    const result = await sut.execute({
      token: TOKEN,
      newPassword: NEW_PASSWORD,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError);
    expect(inMemoryPasswordResetChallengeRepository.items[0].status).toBe(
      "EXPIRED",
    );
  });

  it("should reject a token whose challenge is no longer pending, without mutating it further", async () => {
    const challenge = seedPendingChallenge();
    challenge.markConsumed();

    const result = await sut.execute({
      token: TOKEN,
      newPassword: NEW_PASSWORD,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError);
    expect(inMemoryPasswordResetChallengeRepository.items[0].status).toBe(
      "CONSUMED",
    );
  });

  it("should reject an invalid new password, leaving the challenge pending", async () => {
    seedPendingChallenge();

    const result = await sut.execute({
      token: TOKEN,
      newPassword: "abc", // assumed too short/weak under Password's own policy
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordInvalidError);
    expect(inMemoryPasswordResetChallengeRepository.items[0].status).toBe(
      "PENDING",
    );
  });

  it("should reject when the challenge's user has no local credential", async () => {
    seedPendingChallenge();

    const result = await sut.execute({
      token: TOKEN,
      newPassword: NEW_PASSWORD,
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordResetTokenInvalidError);
  });

  describe("when the token and new password are valid", () => {
    const userId = new UniqueEntityID("user-01");
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      seedPendingChallenge({ userId });

      const credential = makeCredentialAccount(
        {
          passwordHash: "old-hash",
        },
        userId,
      );
      inMemoryAccountRepository.items.push(credential);

      const session = makeSession({ userId });
      inMemorySessionRepository.items.push(session);

      result = await sut.execute({ token: TOKEN, newPassword: NEW_PASSWORD });
    });

    it("should return success", () => {
      expect(result.isRight()).toBe(true);
    });

    it("should mark the challenge CONSUMED", () => {
      const challenge = inMemoryPasswordResetChallengeRepository.items[0];
      expect(challenge.status).toBe("CONSUMED");
      expect(challenge.consumedAt).not.toBeNull();
    });

    it("should update the credential's password hash", async () => {
      const expectedHash = await fakeHasher.hash(NEW_PASSWORD);
      expect(inMemoryAccountRepository.items[0].passwordHash).toBe(
        expectedHash,
      );
    });

    it("should revoke all of the user's sessions with PASSWORD_CHANGED", () => {
      const session = inMemorySessionRepository.items[0];
      expect(session.isRevoked).toBe(true);
      expect(session.revokeReason).toBe("PASSWORD_CHANGED");
    });
  });
});
