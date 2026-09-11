import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { HashComparer } from "@/domain/cryptography/hash-comparer";
import { HashGenerator } from "@/domain/cryptography/hash-generator";
import { Injectable } from "@nestjs/common";
import { InvalidCurrentPasswordError } from "../errors/invalid-current-password-error";
import { UserNotFoundError } from "../errors/user-not-found-error";
import { UserRepository } from "../repositories/user-repository";

interface ChangePasswordUseCaseRequest {
  userId: string;
  currentPassword: string;
  newPassword: string;
}

type ChangePasswordUseCaseResponse = Either<
  UserNotFoundError | InvalidCurrentPasswordError,
  {
    message: string;
  }
>;

@Injectable()
export class ChangePasswordUseCase implements UseCase<
  ChangePasswordUseCaseRequest,
  ChangePasswordUseCaseResponse
> {
  constructor(
    private readonly userRepository: UserRepository,
    private readonly hashComparer: HashComparer,
    private readonly hashGenerator: HashGenerator,
  ) {}

  async execute({
    userId,
    currentPassword,
    newPassword,
  }: ChangePasswordUseCaseRequest): Promise<ChangePasswordUseCaseResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) return left(new UserNotFoundError());

    if (!user.password) return left(new InvalidCurrentPasswordError());

    const passwordMatch = await this.hashComparer.compare(
      currentPassword,
      user.password,
    );
    if (!passwordMatch) return left(new InvalidCurrentPasswordError());

    const newPasswordHash = await this.hashGenerator.hash(newPassword);

    await this.userRepository.updatePassword(userId, newPasswordHash);

    return right({
      message: "Passowrd change successfully.",
    });
  }
}
