import { Either, left, right } from '@/core/either'
import { UnitOfWork } from '@/core/repositories/unit-of-work'
import { PasswordInvalidError } from '@/core/value-objects/errors/password-invalid-error'
import { Password } from '@/core/value-objects/password'
import { UserRoleAssignment } from '@/domain/authorization/entities/user-role-assignment'
import { DefaultRoleNotConfiguredError } from '@/domain/authorization/errors/default-role-not-configured-error'
import { RoleRepository } from '@/domain/authorization/repositories/role-repository'
import { UserRoleAssignmentRepository } from '@/domain/authorization/repositories/user-role-assignment-repository'
import { HashGenerator } from '@/domain/cryptography/hash-generator'
import { Account } from '@/domain/identity/entities/account'
import { User } from '@/domain/identity/entities/user'
import { UserAlreadyExistsError } from '@/domain/identity/errors/user-already-exists-error'
import { CreateUserFactory } from '@/domain/identity/factories/create-user-factory'
import { AccountRepository } from '@/domain/identity/repositories/account-repository'
import { UserRepository } from '@/domain/identity/repositories/user-repository'
import {
  UserProfileFieldsError,
  validateUserProfileFields,
} from '@/domain/identity/services/validate-user-profile-fields'

export type RegisterUserUseCaseRequest = {
  name: string
  cpf: string
  email: string
  phone: string
  birthDate: string
  latitude: number
  longitude: number
  communityId: string
  password: string
}

type RegisterUserUseCaseResponse = Either<
  | UserAlreadyExistsError
  | DefaultRoleNotConfiguredError
  | UserProfileFieldsError
  | PasswordInvalidError,
  {
    user: User
  }
>

export class RegisterUserUseCase {
  constructor(
    private readonly unitOfWork: UnitOfWork,
    private readonly roleRepository: RoleRepository,
    private readonly userRepository: UserRepository,
    private readonly userRoleAssignmentRepository: UserRoleAssignmentRepository,
    private readonly accountRepository: AccountRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(
    data: RegisterUserUseCaseRequest,
  ): Promise<RegisterUserUseCaseResponse> {
    const validated = validateUserProfileFields(data)
    if (validated.isLeft()) {
      return left(validated.value)
    }

    const password = Password.create(data.password)
    if (password.isLeft()) {
      return left(password.value)
    }

    const { cpf, email, phone, birthDate, name, coordinate } = validated.value

    const user = await this.userRepository.findByCpfOrEmailOrPhone(
      cpf.toValue(),
      email.toValue(),
      phone.toValue(),
    )

    if (user) {
      return left(new UserAlreadyExistsError())
    }

    const role = await this.roleRepository.findBySlug('member-community')

    if (!role) {
      return left(new DefaultRoleNotConfiguredError())
    }

    const newUser = CreateUserFactory.create({
      cpf,
      email,
      phone,
      birthDate,
      name,
      coordinate,
    })

    const newUserRoleAssignment = UserRoleAssignment.create({
      roleId: role.id,
      userId: newUser.id,
      assignedByUserId: null,
      assignedAt: new Date(),
      scopeType: 'communityId',
      scopeValue: data.communityId,
    })

    const passwordHash = await this.hashGenerator.hash(password.value.toValue())

    const newAccount = Account.createCredential({
      userId: newUser.id,
      passwordHash,
    })

    await this.unitOfWork.run(async (tx) => {
      await this.userRepository.create(newUser, tx)
      await this.accountRepository.create(newAccount, tx)
      await this.userRoleAssignmentRepository.create(newUserRoleAssignment, tx)
    })

    return right({ user: newUser })
  }
}
