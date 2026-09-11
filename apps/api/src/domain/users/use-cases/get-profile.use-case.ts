import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { User } from "../entities/user";
import { UserNotFoundError } from "../errors/user-not-found-error";
import { UserRepository } from "../repositories/user-repository";

interface GetProfileUseCaseRequest {
  userId: string; 
}

type GetProfileUseCaseResponse = Either<UserNotFoundError, { user: User }>;

@Injectable()
export class GetProfileUseCase implements UseCase<
  GetProfileUseCaseRequest,
  GetProfileUseCaseResponse
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
  }: GetProfileUseCaseRequest): Promise<GetProfileUseCaseResponse> {
    await this.userRepository.invalidateProfileCache(userId);
    const user = await this.userRepository.findById(userId);

    if (!user) return left(new UserNotFoundError());

    return right({ user });
  }
}
