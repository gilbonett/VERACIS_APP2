import { AUTH_STORE_PREFIXES } from "@/application/stores/auth-store";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { TwoFactorChallenge } from "@/domain/identity/entities/two-factor-challenge";
import { TwoFactorChallengeCodeRequestEvent } from "@/domain/identity/events/two-factor-challenge-code-request-event";
import { LoginFlowState } from "@/domain/identity/types/login-flow-state";
import { FakeCodeGenerator } from "../../../../test/cryptography/fake-code-generator";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { makeTwoFactor } from "../../../../test/factories/make-two-factor";
import { makeUser } from "../../../../test/factories/make-user";
import { InMemoryTwoFactorChallengeRepository } from "../../../../test/repositories/in-memory-two-factor-challenge-repository";
import { InMemoryTwoFactorRepository } from "../../../../test/repositories/in-memory-two-factor-repository";
import { InMemoryUserRepository } from "../../../../test/repositories/in-memory-user-repository";
import { FakeAuthStore } from "../../../../test/stores/fake-auth-store";
import { FakeRateLimiterStore } from "../../../../test/stores/fake-rate-limiter-store";
import { SelectTwoFactorMethodUseCase } from "./select-two-factor-method-use-case";

let sut: SelectTwoFactorMethodUseCase;
let fakeAuthStore: FakeAuthStore;
let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryTwoFactorRepository: InMemoryTwoFactorRepository;
let inMemoryTwoFactorChallengeRepository: InMemoryTwoFactorChallengeRepository;
let fakeRateLimiterStore: FakeRateLimiterStore;
let fakeTokenOpaque: FakeTokenOpaque;
let fakeCodeGenerator: FakeCodeGenerator;

const LOGIN_ATTEMPT_TOKEN = "flow-secret";

async function seedLoginFlow(
  overrides: Partial<LoginFlowState> = {},
): Promise<void> {
  const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
  await fakeAuthStore.issue<LoginFlowState>(
    AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
    hashed,
    {
      userId: "user-01",
      ipAddress: null,
      userAgent: null,
      deviceName: null,
      ...overrides,
    },
    600,
  );
}

describe("Select Two Factor Method Use Case", () => {
  beforeEach(() => {
    fakeAuthStore = new FakeAuthStore();
    inMemoryUserRepository = new InMemoryUserRepository();
    inMemoryTwoFactorRepository = new InMemoryTwoFactorRepository();
    inMemoryTwoFactorChallengeRepository =
      new InMemoryTwoFactorChallengeRepository();
    fakeRateLimiterStore = new FakeRateLimiterStore();
    fakeTokenOpaque = new FakeTokenOpaque();
    fakeCodeGenerator = new FakeCodeGenerator();

    sut = new SelectTwoFactorMethodUseCase(
      inMemoryUserRepository,
      inMemoryTwoFactorRepository,
      inMemoryTwoFactorChallengeRepository,
      fakeAuthStore,
      fakeRateLimiterStore,
      fakeTokenOpaque,
      fakeCodeGenerator,
    );
  });

  it("should not be able to select a method when the login flow is not found or expired", async () => {
    const result = await sut.execute({
      loginAttemptToken: "missing-flow",
      twoFactorId: "any-two-factor-id",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should not be able to select a method when the resend rate limit is exceeded", async () => {
    const user = makeUser();
    inMemoryUserRepository.items.push(user);
    await seedLoginFlow({ userId: user.id.toString() });

    const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
    fakeRateLimiterStore.deniedKeys.add(`two-factor:resend:${hashed}`);

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      twoFactorId: "any-two-factor-id",
    });

    expect(result.isLeft()).toBe(true);
    expect(inMemoryTwoFactorChallengeRepository.items).toHaveLength(0);
  });

  it("should not be able to select a two factor id that does not exist", async () => {
    const user = makeUser();
    inMemoryUserRepository.items.push(user);
    await seedLoginFlow({ userId: user.id.toString() });

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      twoFactorId: "missing-two-factor-id",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should not be able to select a two factor that belongs to another user", async () => {
    const user = makeUser();
    inMemoryUserRepository.items.push(user);
    const otherUsersFactor = makeTwoFactor({
      userId: new UniqueEntityID("other-user"),
      type: "EMAIL",
      status: "ENABLED",
    });
    inMemoryTwoFactorRepository.items.push(otherUsersFactor);
    await seedLoginFlow({ userId: user.id.toString() });

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      twoFactorId: otherUsersFactor.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should not be able to select a two factor that is disabled", async () => {
    const user = makeUser();
    inMemoryUserRepository.items.push(user);
    const disabledFactor = makeTwoFactor({
      userId: user.id,
      type: "EMAIL",
      status: "DISABLED",
    });
    inMemoryTwoFactorRepository.items.push(disabledFactor);
    await seedLoginFlow({ userId: user.id.toString() });

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      twoFactorId: disabledFactor.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should not be able to select a TOTP two factor from this flow", async () => {
    const user = makeUser();
    inMemoryUserRepository.items.push(user);
    const totpFactor = makeTwoFactor({
      userId: user.id,
      type: "TOTP",
      status: "ENABLED",
    });
    inMemoryTwoFactorRepository.items.push(totpFactor);
    await seedLoginFlow({ userId: user.id.toString() });

    const result = await sut.execute({
      loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
      twoFactorId: totpFactor.id.toString(),
    });

    expect(result.isLeft()).toBe(true);
  });

  describe("when selecting the EMAIL method", () => {
    let user: ReturnType<typeof makeUser>;
    let result: Awaited<ReturnType<typeof sut.execute>>;
    let challenge: TwoFactorChallenge;
    let event: TwoFactorChallengeCodeRequestEvent;

    beforeEach(async () => {
      user = makeUser();
      inMemoryUserRepository.items.push(user);
      const emailFactor = makeTwoFactor({
        userId: user.id,
        type: "EMAIL",
        status: "ENABLED",
      });
      inMemoryTwoFactorRepository.items.push(emailFactor);
      await seedLoginFlow({
        userId: user.id.toString(),
        ipAddress: "10.0.0.1",
        userAgent: "vitest",
        deviceName: "device",
      });

      result = await sut.execute({
        loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
        twoFactorId: emailFactor.id.toString(),
      });

      challenge = inMemoryTwoFactorChallengeRepository.items[0];
      event = challenge.domainEvents.find(
        (e) => e instanceof TwoFactorChallengeCodeRequestEvent,
      ) as TwoFactorChallengeCodeRequestEvent;
    });

    it("should create a two factor challenge", () => {
      expect(result.isRight()).toBe(true);
      expect(inMemoryTwoFactorChallengeRepository.items).toHaveLength(1);
    });

    it("should emit a code request event with the destination resolved from the user's email", () => {
      expect(event).toBeDefined();
      expect(event.payload.destination).toBe(user.email.toValue());
    });

    it("should persist the challenge reference in the login flow state", async () => {
      const { hashed } = fakeTokenOpaque.generate(LOGIN_ATTEMPT_TOKEN);
      const flowState = await fakeAuthStore.read<LoginFlowState>(
        AUTH_STORE_PREFIXES.LOGIN_ATTEMPT,
        hashed,
      );
      expect(flowState).toEqual(
        expect.objectContaining({
          twoFactorChallengeId: challenge.id.toString(),
        }),
      );
    });
  });

  describe("when selecting the SMS method", () => {
    let user: ReturnType<typeof makeUser>;
    let result: Awaited<ReturnType<typeof sut.execute>>;
    let event: TwoFactorChallengeCodeRequestEvent;

    beforeEach(async () => {
      user = makeUser();
      inMemoryUserRepository.items.push(user);
      const smsFactor = makeTwoFactor({
        userId: user.id,
        type: "SMS",
        status: "ENABLED",
      });
      inMemoryTwoFactorRepository.items.push(smsFactor);
      await seedLoginFlow({
        userId: user.id.toString(),
        ipAddress: "10.0.0.1",
        userAgent: "vitest",
        deviceName: "device",
      });

      result = await sut.execute({
        loginAttemptToken: LOGIN_ATTEMPT_TOKEN,
        twoFactorId: smsFactor.id.toString(),
      });

      const challenge = inMemoryTwoFactorChallengeRepository.items[0];
      event = challenge.domainEvents.find(
        (e) => e instanceof TwoFactorChallengeCodeRequestEvent,
      ) as TwoFactorChallengeCodeRequestEvent;
    });

    it("should create a two factor challenge", () => {
      expect(result.isRight()).toBe(true);
    });

    it("should emit a code request event with the destination resolved from the user's phone", () => {
      expect(event.payload.destination).toBe(user.phone!.toValue());
    });
  });
});
