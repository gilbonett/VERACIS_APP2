import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { User, UserRole } from "../entities/user";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { UserNotFoundError } from "../errors/user-not-found-error";
import { UserRepository } from "../repositories/user-repository";

interface GetUserByIdUseCaseRequest {
  targetUserId: string;
  requesterRole: UserRole;
}

type GetUserByIdUseCaseResponse = Either<
  UserNotFoundError | NotAuthorizedError,
  { user: User }
>;

const ALLOWED_ROLES: UserRole[] = ["MANAGER", "ROOT"];

@Injectable()
export class GetUserByIdUseCase implements UseCase<
  GetUserByIdUseCaseRequest,
  GetUserByIdUseCaseResponse
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    targetUserId,
    requesterRole,
  }: GetUserByIdUseCaseRequest): Promise<GetUserByIdUseCaseResponse> {
    if (!ALLOWED_ROLES.includes(requesterRole)) {
      return left(new NotAuthorizedError());
    }

    const user = await this.userRepository.findById(targetUserId);

    if (!user) return left(new UserNotFoundError());

    return right({ user });
  }
}
