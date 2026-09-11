import { PasswordInvalidError } from "@/core/value-objects/errors/password-invalid-error";
import { DefaultRoleNotConfiguredError } from "@/domain/authorization/errors/default-role-not-configured-error";
import { CpfBadValidError } from "@/domain/identity/errors/cpf-bad-valid-error";
import { UserAlreadyExistsError } from "@/domain/identity/errors/user-already-exists-error";
import { Cpf } from "@/domain/identity/value-objects/cpf";
import { Email } from "@/domain/identity/value-objects/email";
import { Phone } from "@/domain/identity/value-objects/phone";
import { FakeHasher } from "../../../../test/cryptography/fake-hasher";
import { makeRole } from "../../../../test/factories/make-role";
import { makeUser } from "../../../../test/factories/make-user";
import { InMemoryAccountRepository } from "../../../../test/repositories/in-memory-account-repository";
import { InMemoryRoleRepository } from "../../../../test/repositories/in-memory-role-repository";
import { InMemoryUnitOfWorkRepository } from "../../../../test/repositories/in-memory-unit-of-work-repository";
import { InMemoryUserRepository } from "../../../../test/repositories/in-memory-user-repository";
import { InMemoryUserRoleAssignmentRepository } from "../../../../test/repositories/in-memory-user-role-assignment-repository";
import {
  RegisterUserUseCase,
  RegisterUserUseCaseRequest,
} from "./register-user-use-case";

let sut: RegisterUserUseCase;
let inMemoryUnitOfWorkRepository: InMemoryUnitOfWorkRepository;
let inMemoryRoleRepository: InMemoryRoleRepository;
let inMemoryUserRepository: InMemoryUserRepository;
let inMemoryUserRoleAssignmentRepository: InMemoryUserRoleAssignmentRepository;
let inMemoryAccountRepository: InMemoryAccountRepository;
let fakeHasher: FakeHasher;

const validRequest = {
  name: "Maria Silva",
  cpf: "111.444.777-35",
  email: "maria.silva@example.com",
  phone: "(11) 98765-4321",
  birthDate: "1995-05-20",
  latitude: -23.55052,
  longitude: -46.633308,
  communityId: "community-01",
  password: "Sup3r#Secret",
} satisfies RegisterUserUseCaseRequest;

describe("Register User Use Case", () => {
  beforeEach(() => {
    inMemoryUnitOfWorkRepository = new InMemoryUnitOfWorkRepository();
    inMemoryRoleRepository = new InMemoryRoleRepository();
    inMemoryUserRepository = new InMemoryUserRepository();
    inMemoryUserRoleAssignmentRepository =
      new InMemoryUserRoleAssignmentRepository();
    inMemoryAccountRepository = new InMemoryAccountRepository();
    fakeHasher = new FakeHasher();
    sut = new RegisterUserUseCase(
      inMemoryUnitOfWorkRepository,
      inMemoryRoleRepository,
      inMemoryUserRepository,
      inMemoryUserRoleAssignmentRepository,
      inMemoryAccountRepository,
      fakeHasher,
    );
  });

  describe("when the default role exists and the request is valid", () => {
    let result: Awaited<ReturnType<typeof sut.execute>>;

    beforeEach(async () => {
      inMemoryRoleRepository.items.push(makeRole());
      result = await sut.execute(validRequest);
    });

    it("should return success", () => {
      expect(result.isRight()).toBe(true);
    });

    it("should create the new user", () => {
      expect(inMemoryUserRepository.items).toHaveLength(1);
    });

    it("should create the credential account with the password hashed", () => {
      expect(inMemoryAccountRepository.items).toHaveLength(1);
      expect(inMemoryAccountRepository.items[0].passwordHash).toBe(
        "Sup3r#Secret-hashed",
      );
    });

    it("should assign the user role", () => {
      expect(inMemoryUserRoleAssignmentRepository.items).toHaveLength(1);
    });
  });

  it("should not register a user with a password shorter than 8 characters", async () => {
    inMemoryRoleRepository.items.push(makeRole());

    const result = await sut.execute({
      ...validRequest,
      password: "Sh0rt#1",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordInvalidError);
    expect(inMemoryUserRepository.items).toHaveLength(0);
  });

  it("should not register a user with a password missing an uppercase letter", async () => {
    inMemoryRoleRepository.items.push(makeRole());

    const result = await sut.execute({
      ...validRequest,
      password: "sup3r#secret",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordInvalidError);
  });

  it("should not register a user with a password missing a lowercase letter", async () => {
    inMemoryRoleRepository.items.push(makeRole());

    const result = await sut.execute({
      ...validRequest,
      password: "SUP3R#SECRET",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordInvalidError);
  });

  it("should not register a user with a password missing a number", async () => {
    inMemoryRoleRepository.items.push(makeRole());

    const result = await sut.execute({
      ...validRequest,
      password: "Super#Secret",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordInvalidError);
  });

  it("should not register a user with a password missing a special character", async () => {
    inMemoryRoleRepository.items.push(makeRole());

    const result = await sut.execute({
      ...validRequest,
      password: "Sup3rSecret",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(PasswordInvalidError);
    expect(inMemoryUserRepository.items).toHaveLength(0);
  });

  it("should link the user role assignment to the default role and community", async () => {
    const role = makeRole();
    inMemoryRoleRepository.items.push(role);

    const result = await sut.execute({
      ...validRequest,
      communityId: "community-42",
    });

    expect(result.isRight()).toBe(true);
    const assignment = inMemoryUserRoleAssignmentRepository.items[0];
    expect(assignment.roleId).toEqual(role.id);
    expect(assignment.scopeValue).toBe("community-42");
  });

  it("should not register a user with a cpf that already exists", async () => {
    inMemoryRoleRepository.items.push(makeRole());
    inMemoryUserRepository.items.push(
      makeUser({ cpf: Cpf.fromString("11144477735") }),
    );

    const result = await sut.execute({
      ...validRequest,
      cpf: "111.444.777-35",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
    expect(inMemoryUserRepository.items).toHaveLength(1);
  });

  it("should not register a user with an email that already exists", async () => {
    inMemoryRoleRepository.items.push(makeRole());
    inMemoryUserRepository.items.push(
      makeUser({ email: Email.fromString("maria.silva@example.com") }),
    );

    const result = await sut.execute({
      ...validRequest,
      cpf: "529.982.247-25",
      email: "maria.silva@example.com",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
  });

  it("should not register a user with a phone that already exists", async () => {
    inMemoryRoleRepository.items.push(makeRole());
    inMemoryUserRepository.items.push(
      makeUser({ phone: Phone.fromString("(11) 98765-4321") }),
    );

    const result = await sut.execute({
      ...validRequest,
      cpf: "529.982.247-25",
      email: "other@example.com",
      phone: "(11) 98765-4321",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(UserAlreadyExistsError);
  });

  it("should not register a user with an invalid cpf", async () => {
    inMemoryRoleRepository.items.push(makeRole());

    const result = await sut.execute({
      ...validRequest,
      cpf: "111.111.111-11",
    });

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(CpfBadValidError);
    expect(inMemoryUserRepository.items).toHaveLength(0);
  });

  it("should not register a user when the default role is not configured", async () => {
    const result = await sut.execute(validRequest);

    expect(result.isLeft()).toBe(true);
    expect(result.value).toBeInstanceOf(DefaultRoleNotConfiguredError);
    expect(inMemoryUserRepository.items).toHaveLength(0);
  });
});
