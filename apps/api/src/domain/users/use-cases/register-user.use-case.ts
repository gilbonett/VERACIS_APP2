import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { HashGenerator } from "@/domain/cryptography/hash-generator";
import { Injectable } from "@nestjs/common";
import { CreateProfileData, User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-already-exists-error";
import { UserRepository } from "../repositories/user-repository";

interface RegisterUserUseCaseRequest extends CreateProfileData {}

type RegisterUserUseCaseResponse = Either<
  UserAlreadyExistsError,
  { user: User }
>;

@Injectable()
export class RegisterUserUseCase implements UseCase<
  RegisterUserUseCaseRequest,
  RegisterUserUseCaseResponse
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute(
    data: RegisterUserUseCaseRequest,
  ): Promise<RegisterUserUseCaseResponse> {
    const [existingByCpf, existingByEmail] = await Promise.all([
      this.userRepository.findByCpf(data.cpf),
      this.userRepository.findByEmail(data.email),
    ]);

    if (existingByCpf || existingByEmail) {
      return left(new UserAlreadyExistsError());
    }

    const password = await this.hashGenerator.hash(data.password);

    const user = User.create({
      ...data,
      password,
    });

    user.disableOtp();

    await this.userRepository.create(user);

    return right({ user });
  }
}
