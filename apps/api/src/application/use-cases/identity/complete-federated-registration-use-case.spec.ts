import { AUTH_STORE_PREFIXES } from "@/application/stores/auth-store";
import { DefaultRoleNotConfiguredError } from "@/domain/authorization/errors/default-role-not-configured-error";
import { FederatedOnboardingChallengeInvalidError } from "@/domain/identity/errors/federated-onboarding-challenge-invalid-error";
import { UserAlreadyExistsError } from "@/domain/identity/errors/user-already-exists-error";
import { FederatedOnboardingState } from "@/domain/identity/types/federated-onboarding-state";
import { Cpf } from "@/domain/identity/value-objects/cpf";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { FakeTokenSigner } from "../../../../test/cryptography/fake-token-signer";
import { makeFederatedProviderConfig } from "../../../../test/factories/make-federated-provider-config";
import { makeRole } from "../../../../test/factories/make-role";
import { makeUser } from "../../../../test/factories/make-user";
import { InMemoryAccountRepository } from "../../../../test/repositories/in-memory-account-repository";
import { InMemoryFederatedProviderConfigRepository } from "../../../../test/repositories/in-memory-federated-provider-config-repository";
import { InMemoryRoleRepository } from "../../../../test/repositories/in-memory-role-repository";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { InMemorySessionTokenRepository } from "../../../../test/repositories/in-memory-session-token-repository";
import { InMemoryUnitOfWorkRepository } from "../../../../test/repositories/in-memory-unit-of-work-repository";
import { InMemoryUserRepository } from "../../../../test/repositories/in-memory-user-repository";
import { InMemoryUserRoleAssignmentRepository } from "../../../../test/repositories/in-memory-user-role-assignment-repository";
import { FakeAuthStore } from "../../../../test/stores/fake-auth-store";
import {
  CompleteFederatedRegistrationUseCase,
  CompleteFederatedRegistrationUseCaseRequest,
} from "./complete-federated-registration-use-case";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

let sut: CompleteFederatedRegistrationUseCase;
let inMemoryUnitOfWorkRepository: InMemoryUnitOfWorkRepository;
let inMemoryRoleRepository: InMemoryRoleRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryUserRoleAssignmentRepository: InMemoryUserRoleAssignmentRepository;
let inMemoryAccountRepository: InMemoryAccountRepository;
let inMemoryFederatedProviderConfigRepository: InMemoryFederatedProviderConfigRepository;
let fakeAuthStore: FakeAuthStore;
let issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase;

const validRequest = {
  federatedOnboardingId: "onboarding-01",
  name: "Maria Silva",
  cpf: "111.444.777-35",
  email: "maria.silva@example.com",
  phone: "(11) 98765-4321",
  birthDate: "1995-05-20",
  latitude: -23.55052,
  longitude: -46.633308,
  communityId: "community-01",
  ipAddress: "10.0.0.1",
  userAgent: "vitest",
  deviceName: "vitest-device",
} satisfies CompleteFederatedRegistrationUseCaseRequest;

async function seedOnboardingChallenge(providerId: string) {
  await fakeAuthStore.issue<FederatedOnboardingState>(
    AUTH_STORE_PREFIXES.FEDERATED_ONBOARDING,
    "onboarding-01",
    {
      provider: providerId,
      providerSub: "provider-subject-01",
      providerEmail: "maria.silva@example.com",
      providerName: "Maria Silva",
      cpfFromProvider: "11144477735",
      rawAssuranceClaim: null,
      accessToken: "fake-access-token",
      refreshToken: "fake-refresh-token",
      idToken: "fake-id-token",
      accessTokenExpiresAt: new Date(Date.now() + 3600 * 1000).toISOString(),
      scope: "openid profile email",
    },
    600,
  );
}

describe("Complete Federated Registration Use Case", () => {
  beforeEach(() => {
    inMemoryUnitOfWorkRepository = new InMemoryUnitOfWorkRepository();
    inMemoryRoleRepository = new InMemoryRoleRepository();
    inMemoryUserRepository = new InMemoryUserRepository();
    inMemoryUserRoleAssignmentRepository =
      new InMemoryUserRoleAssignmentRepository();
    inMemoryAccountRepository = new InMemoryAccountRepository();
    inMemoryFederatedProviderConfigRepository =
      new InMemoryFederatedProviderConfigRepository();
    fakeAuthStore = new FakeAuthStore();

    issueAuthenticatedSessionUseCase = new IssueAuthenticatedSessionUseCase(
      new InMemorySessionRepository(),
      new InMemorySessionTokenRepository(),
      new InMemoryUserRoleAssignmentRepository(),
      new FakeTokenOpaque(),
      new FakeTokenSigner(),
    );

    sut = new CompleteFederatedRegistrationUseCase(
      inMemoryUnitOfWorkRepository,
      inMemoryRoleRepository,
      inMemoryUserRepository,
      inMemoryUserRoleAssignmentRepository,
      inMemoryAccountRepository,
      inMemoryFederatedProviderConfigRepository,
      fakeAuthStore,
      issueAuthenticatedSessionUseCase,
    );
  });

  it("should return an error when the onboarding challenge is invalid or expired", async () => {
    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(
      FederatedOnboardingChallengeInvalidError,
    );
  });

  describe("when the onboarding challenge and default role are valid", () => {
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      const provider = makeFederatedProviderConfig();
      inMemoryFederatedProviderConfigRepository.items.push(provider);
      await seedOnboardingChallenge(provider.id.toString());
      inMemoryRoleRepository.items.push(makeRole());

      result = await sut.execute(validRequest);
    });

    it("should return success and issue an authenticated session", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");
      expect(result.value.accessToken).toBeTruthy();
      expect(result.value.refreshToken).toBeTruthy();
    });

    it("should create the new user", () => {
      expect(inMemoryUserRepository.items).toHaveLength(1);
    });

    it("should assign the default role to the new user", () => {
      expect(inMemoryUserRoleAssignmentRepository.items).toHaveLength(1);
    });

    it("should link the federated identity to the new user", () => {
      expect(inMemoryAccountRepository.items).toHaveLength(1);
      expect(
        inMemoryAccountRepository.items[0].userId.toString(),
      ).toBe(inMemoryUserRepository.items[0].id.toString());
      expect(inMemoryAccountRepository.items[0].accountId).toBe(
        "provider-subject-01",
      );
    });

    it("should consume the onboarding challenge so it cannot be reused", () => {
      expect(
        fakeAuthStore.items.has(
          `${AUTH_STORE_PREFIXES.FEDERATED_ONBOARDING}:onboarding-01`,
        ),
      ).toBe(false);
    });
  });

  it("should not register when a user with the same cpf, email or phone already exists", async () => {
    const provider = makeFederatedProviderConfig();
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    await seedOnboardingChallenge(provider.id.toString());
    inMemoryRoleRepository.items.push(makeRole());
    inMemoryUserRepository.items.push(
      makeUser({ cpf: Cpf.fromString("11144477735") }),
    );

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
    expect(inMemoryAccountRepository.items).toHaveLength(0);
  });

  it("should not register when the default role is not configured", async () => {
    const provider = makeFederatedProviderConfig();
    inMemoryFederatedProviderConfigRepository.items.push(provider);
    await seedOnboardingChallenge(provider.id.toString());

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DefaultRoleNotConfiguredError);
    expect(inMemoryUserRepository.items).toHaveLength(0);
  });
});
