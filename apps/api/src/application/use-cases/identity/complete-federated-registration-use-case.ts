import {
  AUTH_STORE_PREFIXES,
  AuthStore,
} from "@/application/stores/auth-store";
import { Either, left, right } from "@/core/either";
import { UnitOfWork } from "@/core/repositories/unit-of-work";
import { UserRoleAssignment } from "@/domain/authorization/entities/user-role-assignment";
import { DefaultRoleNotConfiguredError } from "@/domain/authorization/errors/default-role-not-configured-error";
import { RoleRepository } from "@/domain/authorization/repositories/role-repository";
import { UserRoleAssignmentRepository } from "@/domain/authorization/repositories/user-role-assignment-repository";
import { Account } from "@/domain/identity/entities/account";
import { SessionAssuranceLevel } from "@/domain/identity/entities/session";
import { FederatedOnboardingChallengeInvalidError } from "@/domain/identity/errors/federated-onboarding-challenge-invalid-error";
import { ProviderNotAvailableError } from "@/domain/identity/errors/provider-not-available-error";
import { UserAlreadyExistsError } from "@/domain/identity/errors/user-already-exists-error";
import { CreateUserFactory } from "@/domain/identity/factories/create-user-factory";
import { AccountRepository } from "@/domain/identity/repositories/account-repository";
import { FederatedProviderConfigRepository } from "@/domain/identity/repositories/federated-provider-config-repository";
import { UserRepository } from "@/domain/identity/repositories/user-repository";
import { translateAssuranceLevel } from "@/domain/identity/services/translate-assurance-level";
import {
  UserProfileFieldsError,
  validateUserProfileFields,
} from "@/domain/identity/services/validate-user-profile-fields";
import { FederatedOnboardingState } from "@/domain/identity/types/federated-onboarding-state";
import { Injectable } from "@nestjs/common";
import { IssueAuthenticatedSessionUseCase } from "./issue-authenticated-session-use-case";

export type CompleteFederatedRegistrationUseCaseRequest = {
  federatedOnboardingId: string;
  name: string;
  cpf: string;
  email: string;
  phone: string;
  birthDate: string;
  latitude: number;
  longitude: number;
  communityId: string;
  ipAddress: string;
  userAgent: string;
  deviceName: string;
};

type CompleteFederatedRegistrationUseCaseResponse = Either<
  | FederatedOnboardingChallengeInvalidError
  | ProviderNotAvailableError
  | UserAlreadyExistsError
  | DefaultRoleNotConfiguredError
  | UserProfileFieldsError,
  { accessToken: string; refreshToken: string }
>;

@Injectable()
export class CompleteFederatedRegistrationUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly accountRepository: AccountRepository,
    private readonly federatedProviderConfigRepository: FederatedProviderConfigRepository,
    private readonly authStore: AuthStore,
    private readonly issueAuthenticatedSessionUseCase: IssueAuthenticatedSessionUseCase,
  ) {}

  async execute(
    data: CompleteFederatedRegistrationUseCaseRequest,
  ): Promise<CompleteFederatedRegistrationUseCaseResponse> {
    const attempt = await this.authStore.read<FederatedOnboardingState>(
      AUTH_STORE_PREFIXES.FEDERATED_ONBOARDING,
      data.federatedOnboardingId,
    );
    if (!attempt) {
      return left(new FederatedOnboardingChallengeInvalidError());
    }

    const provider = await this.federatedProviderConfigRepository.findById(
      attempt.provider,
    );

    if (!provider || !provider.enabled) {
      return left(new ProviderNotAvailableError());
    }

    const validated = validateUserProfileFields(data);

    if (validated.isLeft()) {
      return left(validated.value);
    }

    const { cpf, email, phone, birthDate, name, coordinate } = validated.value;

    const existingUser = await this.userRepository.findByCpfOrEmailOrPhone(
      cpf.toValue(),
      email.toValue(),
      phone.toValue(),
    );

    if (existingUser) {
      return left(new UserAlreadyExistsError());
    }

    const role = await this.roleRepository.findBySlug("member-community");

    if (!role) {
      return left(new DefaultRoleNotConfiguredError());
    }

    const newUser = CreateUserFactory.create({
      cpf,
      email,
      phone,
      birthDate,
      name,
      coordinate,
    });

    const newUserRoleAssignment = UserRoleAssignment.create({
      roleId: role.id,
      userId: newUser.id,
      assignedByUserId: null,
      assignedAt: new Date(),
      scopeType: "communityId",
      scopeValue: data.communityId,
    });

    const newAccount = Account.createFederated({
      userId: newUser.id,
      providerId: attempt.provider,
      accountId: attempt.providerSub,
      accessToken: attempt.accessToken,
      refreshToken: attempt.refreshToken,
      idToken: attempt.idToken,
      accessTokenExpiresAt: attempt.accessTokenExpiresAt
        ? new Date(attempt.accessTokenExpiresAt)
        : null,
      scope: attempt.scope,
      rawAssuranceClaim: attempt.rawAssuranceClaim,
    });

    await this.unitOfWork.run(async (tx) => {
      await this.userRepository.create(newUser, tx);
      await this.userRoleAssignmentRepository.create(newUserRoleAssignment, tx);
      await this.accountRepository.create(newAccount, tx);
    });

    await this.authStore.revoke(
      AUTH_STORE_PREFIXES.FEDERATED_ONBOARDING,
      data.federatedOnboardingId,
    );

    const assuranceLevel: SessionAssuranceLevel = translateAssuranceLevel(
      attempt.rawAssuranceClaim,
    );

    const { accessToken, refreshToken } =
      await this.issueAuthenticatedSessionUseCase.execute({
        userId: newUser.id.toString(),
        assuranceLevel,
        ipAddress: data.ipAddress,
        userAgent: data.userAgent,
        deviceName: data.deviceName,
      });

    return right({ accessToken, refreshToken });
  }
}
