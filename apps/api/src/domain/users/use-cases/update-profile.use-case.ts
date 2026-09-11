import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { User } from "../entities/user";
import { UserAlreadyExistsError } from "../errors/user-already-exists-error";
import { UserNotFoundError } from "../errors/user-not-found-error";
import { UserRepository } from "../repositories/user-repository";

interface UpdateProfileUseCaseRequest {
  userId: string;
  name?: string;
  email?: string;
  phone?: string | null;
  emailRecovery?: string | null;
  avatarUrl?: string | null;
}

type UpdateProfileUseCaseResponse = Either<
  UserNotFoundError | UserAlreadyExistsError,
  { user: User }
>;

@Injectable()
export class UpdateProfileUseCase implements UseCase<
  UpdateProfileUseCaseRequest,
  UpdateProfileUseCaseResponse
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute(
    data: UpdateProfileUseCaseRequest,
  ): Promise<UpdateProfileUseCaseResponse> {
    const user = await this.userRepository.findById(data.userId);
    if (!user) return left(new UserNotFoundError());

    if (data.email && data.email !== user.email) {
      const existingByEmail = await this.userRepository.findByEmail(data.email);

      if (existingByEmail) return left(new UserAlreadyExistsError());
    }

    user.updateProfile(data);

    await this.userRepository.save(user);

    return right({ user });
  }
}
