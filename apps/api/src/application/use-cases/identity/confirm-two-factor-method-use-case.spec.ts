import { AUTH_STORE_PREFIXES } from "@/application/stores/auth-store";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  LoginFlowChallenge,
  LoginFlowState,
} from "@/domain/identity/types/login-flow-state";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { FakeTokenSigner } from "../../../../test/cryptography/fake-token-signer";
import { makeTwoFactor } from "../../../../test/factories/make-two-factor";
import { makeTwoFactorChallenge } from "../../../../test/factories/make-two-factor-challenge";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { InMemorySessionTokenRepository } from "../../../../test/repositories/in-memory-session-token-repository";
import { InMemoryTwoFactorChallengeRepository } from "../../../../test/repositories/in-memory-two-factor-challenge-repository";
import { InMemoryTwoFactorRepository } from "../../../../test/repositories/in-memory-two-factor-repository";
import { InMemoryUserRoleAssignmentRepository } from "../../../../test/repositories/in-memory-user-role-assignment-repository";
import { FakeAuthStore } from "../../../../test/stores/fake-auth-store";
import { ConfirmTwoFactorChallengeUseCase } from "./confirm-two-factor-method-use-case";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

let sut: ConfirmTwoFactorChallengeUseCase;
let inMemoryTwoFactorChallengeRepository: InMemoryTwoFactorChallengeRepository;
let inMemoryTwoFactorRepository: InMemoryTwoFactorRepository;
let fakeAuthStore: FakeAuthStore;
let fakeTokenOpaque: FakeTokenOpaque;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemorySessionTokenRepository: InMemorySessionTokenRepository;
let inMemoryUserRoleAssignmentRepository: InMemoryUserRoleAssignmentRepository;
let issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase;

const CODE = "123456";
const LOGIN_ATTEMPT_TOKEN = "flow-secret";

async function seedPendingChallenge({
  userId = new UniqueEntityID(),
  attemptCount = 0,
}: {
  userId?: UniqueEntityID;
  attemptCount?: number;
} = {}) {
  const twoFactor = makeTwoFactor({ userId, type: "EMAIL", status: "ENABLED" });
  inMemoryTwoFactorRepository.items.push(twoFactor);

  const { hashed: codeHash } = fakeTokenOpaque.generate(CODE);
  const challenge = makeTwoFactorChallenge({
    userId,
    twoFactorId: twoFactor.id,
    status: "PENDING",
    codeHash,
    attemptCount,
    expiresAt: new Date(Date.now() + 10 * 60 * 1000),
  });
  inMemoryTwoFactorChallengeRepository.items.push(challenge);

  const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
  await fakeAuthStore.issue<LoginFlowChallenge>(
    AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
    hashed,
    {
      userId: userId.toString(),
      ipAddress: null,
      userAgent: null,
      deviceName: null,
      twoFactorId: twoFactor.id.toString(),
      twoFactorChallengeId: challenge.id.toString(),
    },
    600,
  );

  return { twoFactor, challenge };
}

describe("Confirm Two Factor Challenge Use Case", () => {
  beforeEach(() => {
    inMemoryTwoFactorChallengeRepository =
      new InMemoryTwoFactorChallengeRepository();
    inMemoryTwoFactorRepository = new InMemoryTwoFactorRepository();
    fakeAuthStore = new FakeAuthStore();
    fakeTokenOpaque = new FakeTokenOpaque();
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemorySessionTokenRepository = new InMemorySessionTokenRepository();
    inMemoryUserRoleAssignmentRepository =
      new InMemoryUserRoleAssignmentRepository();

    issueAuthenticatedSessionUseCase = new IssueAuthenticatedSessionUseCase(
      inMemorySessionRepository,
      inMemorySessionTokenRepository,
      inMemoryUserRoleAssignmentRepository,
      fakeTokenOpaque,
      new FakeTokenSigner(),
    );

    sut = new ConfirmTwoFactorChallengeUseCase(
      inMemoryTwoFactorChallengeRepository,
      inMemoryTwoFactorRepository,
      fakeAuthStore,
      fakeTokenOpaque,
      issueAuthenticatedSessionUseCase,
    );
  });

  it("should not confirm when the login flow is not found or expired", async () => {
    const result = await sut.execute({
      loginAttemptToken: "missing-flow",
      code: CODE,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should not confirm when no two factor method was selected yet", async () => {
    const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
    await fakeAuthStore.issue<LoginFlowState>(
      AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
      hashed,
      {
        userId: "user-01",
        ipAddress: null,
        userAgent: null,
        deviceName: null,
      },
      600,
    );

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      code: CODE,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should reject a challenge that is already expired", async () => {
    const { challenge } = await seedPendingChallenge();
    challenge.markExpired();
    await inMemoryTwoFactorChallengeRepository.save(challenge);

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      code: CODE,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should not confirm a challenge that is no longer pending", async () => {
    const { challenge } = await seedPendingChallenge();
    challenge.markFailed();
    await inMemoryTwoFactorChallengeRepository.save(challenge);

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      code: CODE,
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should return an invalid code error and persist the incremented attempt count on the challenge", async () => {
    await seedPendingChallenge();

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      code: "wrong-code",
    });

    expect(result.isLeft()).toBe(true);
    expect(inMemoryTwoFactorChallengeRepository.items[0].attemptCount).toBe(1);
  });

  describe("when the maximum number of attempts is exhausted", () => {
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      await seedPendingChallenge({ attemptCount: 5 });

      result = await sut.execute({
        loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
        code: "wrong-code",
      });
    });

    it("should return an OTP attempts exceeded error", () => {
      expect(result.isLeft()).toBe(true);
    });

    it("should consider the challenge failed", () => {
      expect(inMemoryTwoFactorChallengeRepository.items[0].isFailed).toBe(
        true,
      );
    });

    it("should revoke the whole login flow", async () => {
      const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
      const state = await fakeAuthStore.read<LoginFlowState>(
        AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
        hashed,
      );
      expect(state).toBeNull();
    });
  });

  describe("when the code is valid", () => {
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      await seedPendingChallenge();

      result = await sut.execute({
        loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
        code: CODE,
      });
    });

    it("should authenticate the user", () => {
      expect(result.isRight()).toBe(true);
      expect(result.value).toMatchObject({ status: "AUTHENTICATED" });
    });

    it("should issue a session with MEDIUM assurance level", () => {
      const session = inMemorySessionRepository.items[0];
      expect(session.assuranceLevel).toBe("MEDIUM");
    });

    it("should mark the two-factor challenge as VERIFIED", () => {
      expect(inMemoryTwoFactorChallengeRepository.items[0].status).toBe(
        "VERIFIED",
      );
    });

    it("should mark the two-factor method as used", () => {
      expect(inMemoryTwoFactorRepository.items[0].lastUsedAt).not.toBeNull();
    });

    it("should revoke the login flow so it cannot be reused", async () => {
      const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
      const state = await fakeAuthStore.read<LoginFlowState>(
        AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
        hashed,
      );
      expect(state).toBeNull();
    });
  });

  it("should not allow replaying an already confirmed flow", async () => {
    await seedPendingChallenge();

    await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      code: CODE,
    });
    expect(inMemorySessionRepository.items).toHaveLength(1);

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      code: CODE,
    });

    expect(result.isLeft()).toBe(true);
    expect(inMemorySessionRepository.items).toHaveLength(1);
  });
});
