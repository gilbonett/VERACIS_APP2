import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { User, UserRole } from "../entities/user";
import { NotAuthorizedError } from "../errors/not-authorized-error";
import { UserRepository } from "../repositories/user-repository";
// import {
//   UsersRepository,
//   ListUsersFilters,
//   PaginatedResult,
// } from '../repositories/users-repository'
// import { User, UserRole } from '../../enterprise/entities/user'
// import { NotAuthorizedError } from '../errors'

interface ListUsersUseCaseRequest {
  requesterRole: UserRole;
}

type ListUsersUseCaseResponse = Either<
  NotAuthorizedError,
  {
    users: User[];
  }
>;

const ALLOWED_ROLES: UserRole[] = ["MANAGER", "ROOT"];

@Injectable()
export class ListUsersUseCase implements UseCase<
  ListUsersUseCaseRequest,
  ListUsersUseCaseResponse
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    requesterRole,
    // ...filters
  }: ListUsersUseCaseRequest): Promise<ListUsersUseCaseResponse> {
    if (!ALLOWED_ROLES.includes(requesterRole)) {
      return left(new NotAuthorizedError());
    }

    const users = await this.userRepository.findAll();

    return right({ users });
  }
}
