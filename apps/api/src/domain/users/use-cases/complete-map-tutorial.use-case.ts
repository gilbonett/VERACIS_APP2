import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { UserNotFoundError } from "../errors/user-not-found-error";
import { User } from "../entities/user";
import { UserRepository } from "../repositories/user-repository";

interface CompleteMapTutorialUseCaseRequest {
  userId: string;
}

type CompleteMapTutorialUseCaseResponse = Either<
  UserNotFoundError,
  { user: User }
>;

@Injectable()
export class CompleteMapTutorialUseCase implements UseCase<
  CompleteMapTutorialUseCaseRequest,
  CompleteMapTutorialUseCaseResponse
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
  }: CompleteMapTutorialUseCaseRequest): Promise<CompleteMapTutorialUseCaseResponse> {
    const user = await this.userRepository.findById(userId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    user.completeMapTutorial();
    await this.userRepository.save(user);

    return right({ user });
  }
}
