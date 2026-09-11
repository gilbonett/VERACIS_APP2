import { Account } from "@/domain/identity/entities/account";
import { UserStatusEnum } from "@/domain/identity/entities/user";
import { Cpf } from "@/domain/identity/value-objects/cpf";
import { FakeHasher } from "../../../../test/cryptography/fake-hasher";
import { FakeTokenOpaque } from "../../../../test/cryptography/fake-token-opaque";
import { FakeTokenSigner } from "../../../../test/cryptography/fake-token-signer";
import { makeTwoFactor } from "../../../../test/factories/make-two-factor";
import { makeUser } from "../../../../test/factories/make-user";
import { InMemoryAccountRepository } from "../../../../test/repositories/in-memory-account-repository";
import { InMemorySessionRepository } from "../../../../test/repositories/in-memory-session-repository";
import { InMemorySessionTokenRepository } from "../../../../test/repositories/in-memory-session-token-repository";
import { InMemoryTwoFactorRepository } from "../../../../test/repositories/in-memory-two-factor-repository";
import { InMemoryUserRepository } from "../../../../test/repositories/in-memory-user-repository";
import { InMemoryUserRoleAssignmentRepository } from "../../../../test/repositories/in-memory-user-role-assignment-repository";
import { FakeAuthStore } from "../../../../test/stores/fake-auth-store";
import { FakeRateLimiterStore } from "../../../../test/stores/fake-rate-limiter-store";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";
import { SignInUseCase } from "./sign-in-use-case";

let sut: SignInUseCase;
let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryAccountRepository: InMemoryAccountRepository;
let inMemoryTwoFactorRepository: InMemoryTwoFactorRepository;
let inMemorySessionRepository: InMemorySessionRepository;
let inMemorySessionTokenRepository: InMemorySessionTokenRepository;
let inMemoryUserRoleAssignmentRepository: InMemoryUserRoleAssignmentRepository;
let fakeAuthStore: FakeAuthStore;
let fakeRateLimiterStore: FakeRateLimiterStore;
let fakeHasher: FakeHasher;
let fakeTokenOpaque: FakeTokenOpaque;
let issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase;

const VALID_CPF = "11144477735";

const validRequest = {
  cpf: VALID_CPF,
  password: "Sup3r#Secret",
  ipAddress: "10.0.0.1",
  userAgent: "vitest",
  deviceName: "vitest-device",
};

async function seedActiveUserWithCredential(password = "Sup3r#Secret") {
  const user = makeUser({ cpf: Cpf.fromString(VALID_CPF) });
  inMemoryUserRepository.items.push(user);

  const credential = Account.createCredential({
    userId: user.id,
    passwordHash: `${password}-hashed`,
  });
  inMemoryAccountRepository.items.push(credential);

  return { user, credential };
}

describe("Sign In Use Case", () => {
  beforeEach(() => {
    inMemoryUserRepository = new InMemoryUserRepository();
    inMemoryAccountRepository = new InMemoryAccountRepository();
    inMemoryTwoFactorRepository = new InMemoryTwoFactorRepository();
    inMemorySessionRepository = new InMemorySessionRepository();
    inMemorySessionTokenRepository = new InMemorySessionTokenRepository();
    inMemoryUserRoleAssignmentRepository =
      new InMemoryUserRoleAssignmentRepository();
    fakeAuthStore = new FakeAuthStore();
    fakeRateLimiterStore = new FakeRateLimiterStore();
    fakeHasher = new FakeHasher();
    fakeTokenOpaque = new FakeTokenOpaque();

    issueAuthenticatedSessionUseCase = new IssueAuthenticatedSessionUseCase(
      inMemorySessionRepository,
      inMemorySessionTokenRepository,
      inMemoryUserRoleAssignmentRepository,
      fakeTokenOpaque,
      new FakeTokenSigner(),
    );

    sut = new SignInUseCase(
      inMemoryUserRepository,
      fakeHasher,
      fakeHasher,
      inMemoryAccountRepository,
      inMemoryTwoFactorRepository,
      fakeAuthStore,
      fakeRateLimiterStore,
      fakeTokenOpaque,
      issueAuthenticatedSessionUseCase,
    );
  });

  it("should not be able to sign in when the cpf rate limit is exceeded", async () => {
    fakeRateLimiterStore.deniedKeys.add(`login:cpf:${validRequest.cpf}`);

    const findByCpfSpy = vi.spyOn(inMemoryUserRepository, "findUniqueByCpf");

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(findByCpfSpy).not.toHaveBeenCalled();
  });

  it("should not be able to sign in when the ip rate limit is exceeded for different cpfs", async () => {
    fakeRateLimiterStore.deniedKeys.add(`login:ip:${validRequest.ipAddress}`);

    const findByCpfSpy = vi.spyOn(inMemoryUserRepository, "findUniqueByCpf");

    const result = await sut.execute({
      ...validRequest,
      cpf: "52998224725",
    });

    expect(result.isLeft()).toBe(true);
    expect(findByCpfSpy).not.toHaveBeenCalled();
  });

  it("should not be able to sign in when the user is not found, but still hash the password", async () => {
    const hashSpy = vi.spyOn(fakeHasher, "hash");

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(hashSpy).toHaveBeenCalledWith(validRequest.password);
  });

  it("should not be able to sign in when the user is inactive, but still hash the password", async () => {
    const user = makeUser({
      cpf: Cpf.fromString(VALID_CPF),
      status: UserStatusEnum.DISABLED,
    });
    inMemoryUserRepository.items.push(user);

    const hashSpy = vi.spyOn(fakeHasher, "hash");

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(hashSpy).toHaveBeenCalledWith(validRequest.password);
  });

  it("should not be able to sign in when the active user has no local credential, but still hash the password", async () => {
    const user = makeUser({ cpf: Cpf.fromString(VALID_CPF) });
    inMemoryUserRepository.items.push(user);

    const hashSpy = vi.spyOn(fakeHasher, "hash");

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(hashSpy).toHaveBeenCalledWith(validRequest.password);
  });

  it("should not be able to sign in when the local credential is locked", async () => {
    const { credential } = await seedActiveUserWithCredential();
    credential.incrementFailedAttempts();
    credential.incrementFailedAttempts();
    credential.incrementFailedAttempts();
    credential.incrementFailedAttempts();
    credential.incrementFailedAttempts();

    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(credential.isLocked).toBe(true);
  });

  it("should not be able to sign in with a wrong password and persist the incremented failed attempts", async () => {
    await seedActiveUserWithCredential();

    const result = await sut.execute({
      ...validRequest,
      password: "wrong-password",
    });

    expect(result.isLeft()).toBe(true);
    expect(inMemoryAccountRepository.items[0].failedAttempts).toBe(1);
  });

  it("should reset the failed attempts and persist it when the password is correct", async () => {
    const { credential } = await seedActiveUserWithCredential();
    credential.incrementFailedAttempts();
    await inMemoryAccountRepository.save(credential);

    await sut.execute(validRequest);

    expect(inMemoryAccountRepository.items[0].failedAttempts).toBe(0);
  });

  describe("when the user has no two factor enabled", () => {
    let executeSpy: ReturnType<typeof vi.spyOn>;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      await seedActiveUserWithCredential();
      executeSpy = vi.spyOn(issueAuthenticatedSessionUseCase, "execute");

      result = await sut.execute(validRequest);
    });

    it("should authenticate the user", () => {
      expect(result.isRight()).toBe(true);
      expect(result.value).toMatchObject({ status: "AUTHENTICATED" });
    });

    it("should issue the session with LOW assurance", () => {
      expect(executeSpy).toHaveBeenCalledWith(
        expect.objectContaining({ assuranceLevel: "LOW" }),
      );
    });

    it("should not persist a login flow state", () => {
      expect(fakeAuthStore.items.size).toBe(0);
    });
  });

  describe("when the user has two factor methods enabled", () => {
    let emailFactor: ReturnType<typeof makeTwoFactor>;
    let smsFactor: ReturnType<typeof makeTwoFactor>;
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      const { user } = await seedActiveUserWithCredential();
      emailFactor = makeTwoFactor({
        userId: user.id,
        type: "EMAIL",
        status: "ENABLED",
      });
      smsFactor = makeTwoFactor({
        userId: user.id,
        type: "SMS",
        status: "ENABLED",
      });
      inMemoryTwoFactorRepository.items.push(emailFactor, smsFactor);

      result = await sut.execute(validRequest);
    });

    it("should require two factor selection", () => {
      expect(result.isRight()).toBe(true);
      if (result.isLeft()) throw new Error("expected right");
      expect(result.value).toMatchObject({ status: "TWO_FACTOR_REQUIRED" });
    });

    it("should return a login attempt token", () => {
      if (result.isLeft()) throw new Error("expected right");
      if (result.value.status !== "TWO_FACTOR_REQUIRED")
        throw new Error("expected two factor required");
      expect(result.value.loginAttemptToken).toBeTruthy();
    });

    it("should list all enabled two factor methods", () => {
      if (result.isLeft()) throw new Error("expected right");
      if (result.value.status !== "TWO_FACTOR_REQUIRED")
        throw new Error("expected two factor required");
      expect(result.value.methods).toEqual(
        expect.arrayContaining([
          { twoFactorId: emailFactor.id.toString(), type: "EMAIL" },
          { twoFactorId: smsFactor.id.toString(), type: "SMS" },
        ]),
      );
      expect(result.value.methods).toHaveLength(2);
    });

    it("should not create a session yet", () => {
      expect(inMemorySessionRepository.items).toHaveLength(0);
    });
  });
});
