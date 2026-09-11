import { AUTH_STORE_PREFIXES } from "@/application/stores/auth-store";
import { FederatedAttemptStoreData } from "@/domain/identity/types/federated-attempt-state";
import { FederatedOnboardingState } from "@/domain/identity/types/federated-onboarding-state";
import { Cpf } from "@/domain/identity/value-objects/cpf";
import { Email } from "@/domain/identity/value-objects/email";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { FakeTokenSigner } from "../../../../test/cryptography/fake-token-signer";
import { makeFederatedAccount } from "../../../../test/factories/make-account";
import { makeFederatedProviderConfig } from "../../../../test/factories/make-federated-provider-config";
import { makeUser } from "../../../../test/factories/make-user";
import { FakeFederatedAuthenticationCallback } from "../../../../test/gateways/fake-federated-authentication-callback";
import { InMemoryAccountRepository } from "../../../../test/repositories/in-memory-account-repository";
import { InMemoryFederatedProviderConfigRepository } from "../../../../test/repositories/in-memory-federated-provider-config-repository";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { InMemorySessionTokenRepository } from "../../../../test/repositories/in-memory-session-token-repository";
import { InMemoryUserRepository } from "../../../../test/repositories/in-memory-user-repository";
import { InMemoryUserRoleAssignmentRepository } from "../../../../test/repositories/in-memory-user-role-assignment-repository";
import { FakeAuthStore } from "../../../../test/stores/fake-auth-store";
import { CompleteFederatedLoginUseCase } from "./complete-federated-login-use-case";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

let sut: CompleteFederatedLoginUseCase;
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository;
let inMemoryAccountRepository: InMemoryAccountRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let fakeFederatedAuthenticationCallback: FakeFederatedAuthenticationCallback;
let fakeAuthStore: FakeAuthStore;
let issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase;

const HIGH_ASSURANCE_CLAIM = "HIGH";
const MEDIUM_ASSURANCE_CLAIM = "MEDIUM";

async function seedAttempt(providerId: string, attemptId = "valid-attempt") {
  await fakeAuthStore.issue<FederatedAttemptStoreData>(
    AUTH_STORE_PREFIXES.FEDERATED_ATTEMPT,
    attemptId,
    { nonce: "fake-nonce", codeVerifier: "fake-code-verifier", providerId },
    600,
  );
  return attemptId;
}

describe("Complete Federated Login Use Case", () => {
  beforeEach(() => {
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository();
    inMemoryAccountRepository = new InMemoryAccountRepository();
    inMemoryUserRepository = new InMemoryUserRepository();
    fakeFederatedAuthenticationCallback =
      new FakeFederatedAuthenticationCallback();
    fakeAuthStore = new FakeAuthStore();

    issueAuthenticatedSessionUseCase = new IssueAuthenticatedSessionUseCase(
      new InMemorySessionRepository(),
      new InMemorySessionTokenRepository(),
      new InMemoryUserRoleAssignmentRepository(),
      new FakeTokenOpaque(),
      new FakeTokenSigner(),
    );

    sut = new CompleteFederatedLoginUseCase(
      inMemoryFederatedProviderConfigRepository,
      inMemoryAccountRepository,
      inMemoryUserRepository,
      fakeFederatedAuthenticationCallback,
      fakeAuthStore,
      issueAuthenticatedSessionUseCase,
    );
  });

  it("should return an error when the provider does not exist or is disabled", async () => {
    const result = await sut.execute({
      slug: "missing-provider",
      code: "auth-code",
      state: "any-state",
      federatedAttemptId: "any-state",
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
      deviceName: "vitest-device",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should return an error when the state does not match the federated attempt id from the cookie", async () => {
    const provider = makeFederatedProviderConfig();
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    await seedAttempt(provider.id.toString());

    const result = await sut.execute({
      slug: provider.slug.value,
      code: "auth-code",
      state: "a-different-state",
      federatedAttemptId: "valid-attempt",
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
      deviceName: "vitest-device",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should return an error when the attempt is missing or was issued for another provider", async () => {
    const provider = makeFederatedProviderConfig();
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    await seedAttempt("other-provider-id", "valid-attempt");

    const result = await sut.execute({
      slug: provider.slug.value,
      code: "auth-code",
      state: "valid-attempt",
      federatedAttemptId: "valid-attempt",
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
      deviceName: "vitest-device",
    });

    expect(result.isLeft()).toBe(true);
  });

  it("should return an error when the token exchange with the provider fails", async () => {
    const provider = makeFederatedProviderConfig();
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    const attemptId = await seedAttempt(provider.id.toString());
    fakeFederatedAuthenticationCallback.shouldFail = true;

    const result = await sut.execute({
      slug: provider.slug.value,
      code: "auth-code",
      state: attemptId,
      federatedAttemptId: attemptId,
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
      deviceName: "vitest-device",
    });

    expect(result.isLeft()).toBe(true);
  });

  describe("when the federated identity is already linked", () => {
    let attemptId: string;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      const provider = makeFederatedProviderConfig();
      inMemoryFederatedProviderConfigRepository.items.push(provider);
      attemptId = await seedAttempt(provider.id.toString());

      const user = makeUser();
      inMemoryUserRepository.items.push(user);
      inMemoryAccountRepository.items.push(
        makeFederatedAccount({
          userId: user.id,
          providerId: provider.id.toString(),
          accountId: fakeFederatedAuthenticationCallback.callbackResult.subject,
        }),
      );

      result = await sut.execute({
        slug: provider.slug.value,
        code: "auth-code",
        state: attemptId,
        federatedAttemptId: attemptId,
        ipAddress: "10.0.0.1",
        userAgent: "vitest",
        deviceName: "vitest-device",
      });
    });

    it("should authenticate the user directly and return session tokens", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");
      expect(result.value.status).toBe("AUTHENTICATED");
      if (result.value.status !== "AUTHENTICATED")
        throw new Error("wrong status");
      expect(result.value.accessToken).toBeTruthy();
      expect(result.value.refreshToken).toBeTruthy();
    });

    it("should consume the federated attempt so it cannot be reused", async () => {
      expect(
        await fakeAuthStore.consume(
          AUTH_STORE_PREFIXES.FEDERATED_ATTEMPT,
          attemptId,
        ),
      ).toBeNull();
    });
  });

  it("should deny login when cpf matches an existing user but the provider assurance is insufficient", async () => {
    const provider = makeFederatedProviderConfig({ suppliesCpfClaim: true });
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    const attemptId = await seedAttempt(provider.id.toString());

    const user = makeUser({ cpf: Cpf.fromString("24097196006") });
    inMemoryUserRepository.items.push(user);
    fakeFederatedAuthenticationCallback.callbackResult = {
      ...fakeFederatedAuthenticationCallback.callbackResult,
      cpf: "24097196006",
    };

    const result = await sut.execute({
      slug: provider.slug.value,
      code: "auth-code",
      state: attemptId,
      federatedAttemptId: attemptId,
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
      deviceName: "vitest-device",
    });

    expect(result.isLeft()).toBe(true);
    expect(inMemoryAccountRepository.items).toHaveLength(0);
  });

  describe("when cpf matches an existing user and assurance is sufficient", () => {
    let user: ReturnType<typeof makeUser>;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      const provider = makeFederatedProviderConfig({ suppliesCpfClaim: true });
      inMemoryFederatedProviderConfigRepository.items.push(provider);
      const attemptId = await seedAttempt(provider.id.toString());

      user = makeUser({ cpf: Cpf.fromString("24097196006") });
      inMemoryUserRepository.items.push(user);
      fakeFederatedAuthenticationCallback.callbackResult = {
        ...fakeFederatedAuthenticationCallback.callbackResult,
        cpf: "24097196006",
        rawAssuranceClaim: HIGH_ASSURANCE_CLAIM,
      };

      result = await sut.execute({
        slug: provider.slug.value,
        code: "auth-code",
        state: attemptId,
        federatedAttemptId: attemptId,
        ipAddress: "10.0.0.1",
        userAgent: "vitest",
        deviceName: "vitest-device",
      });
    });

    it("should authenticate the user directly", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");
      expect(result.value.status).toBe("AUTHENTICATED");
    });

    it("should auto-link the federated identity to the matched user", () => {
      expect(inMemoryAccountRepository.items).toHaveLength(1);
      expect(
        inMemoryAccountRepository.items[0].userId.toString(),
      ).toBe(user.id.toString());
      expect(inMemoryAccountRepository.items[0].accountId).toBe(
        fakeFederatedAuthenticationCallback.callbackResult.subject,
      );
    });
  });

  it("should deny login when email matches an existing user but the provider assurance is insufficient", async () => {
    const provider = makeFederatedProviderConfig({ suppliesCpfClaim: false });
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    const attemptId = await seedAttempt(provider.id.toString());

    const user = makeUser({
      email: Email.fromString("maria.silva@example.com"),
    });
    inMemoryUserRepository.items.push(user);

    const result = await sut.execute({
      slug: provider.slug.value,
      code: "auth-code",
      state: attemptId,
      federatedAttemptId: attemptId,
      ipAddress: "10.0.0.1",
      userAgent: "vitest",
      deviceName: "vitest-device",
    });

    expect(result.isLeft()).toBe(true);
    expect(inMemoryAccountRepository.items).toHaveLength(0);
  });

  describe("when email matches an existing user and assurance is sufficient", () => {
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      const provider = makeFederatedProviderConfig({ suppliesCpfClaim: false });
      inMemoryFederatedProviderConfigRepository.items.push(provider);
      const attemptId = await seedAttempt(provider.id.toString());

      const user = makeUser({
        email: Email.fromString("maria.silva@example.com"),
      });
      inMemoryUserRepository.items.push(user);
      fakeFederatedAuthenticationCallback.callbackResult = {
        ...fakeFederatedAuthenticationCallback.callbackResult,
        rawAssuranceClaim: MEDIUM_ASSURANCE_CLAIM,
      };

      result = await sut.execute({
        slug: provider.slug.value,
        code: "auth-code",
        state: attemptId,
        federatedAttemptId: attemptId,
        ipAddress: "10.0.0.1",
        userAgent: "vitest",
        deviceName: "vitest-device",
      });
    });

    it("should authenticate the user directly", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");
      expect(result.value.status).toBe("AUTHENTICATED");
    });

    it("should auto-link the federated identity to the matched user", () => {
      expect(inMemoryAccountRepository.items).toHaveLength(1);
    });
  });

  describe("when there is no linked identity and no matching user", () => {
    let provider: ReturnType<typeof makeFederatedProviderConfig>;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      provider = makeFederatedProviderConfig({ suppliesCpfClaim: true });
      inMemoryFederatedProviderConfigRepository.items.push(provider);
      const attemptId = await seedAttempt(provider.id.toString());

      result = await sut.execute({
        slug: provider.slug.value,
        code: "auth-code",
        state: attemptId,
        federatedAttemptId: attemptId,
        ipAddress: "10.0.0.1",
        userAgent: "vitest",
        deviceName: "vitest-device",
      });
    });

    it("should require onboarding with the provider's profile data", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");
      expect(result.value.status).toBe("ONBOARDING_REQUIRED");
      if (result.value.status !== "ONBOARDING_REQUIRED") {
        throw new Error("wrong status");
      }

      expect(result.value.name).toBe(
        fakeFederatedAuthenticationCallback.callbackResult.name,
      );
      expect(result.value.email).toBe(
        fakeFederatedAuthenticationCallback.callbackResult.email,
      );
      expect(result.value.cpf).toBe(
        fakeFederatedAuthenticationCallback.callbackResult.cpf,
      );
    });

    it("should persist the onboarding state keyed by the returned federatedOnboardingId", async () => {
      if (result.isLeft()) throw new Error("expected right");
      if (result.value.status !== "ONBOARDING_REQUIRED") {
        throw new Error("wrong status");
      }

      const onboarding = await fakeAuthStore.read<FederatedOnboardingState>(
        AUTH_STORE_PREFIXES.FEDERATED_ONBOARDING,
        result.value.federatedOnboardingId,
      );
      expect(onboarding).toEqual(
        expect.objectContaining({
          provider: provider.id.toString(),
          providerSub:
            fakeFederatedAuthenticationCallback.callbackResult.subject,
        }),
      );
    });
  });
});
