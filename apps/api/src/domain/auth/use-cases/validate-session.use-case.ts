import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { User } from "@/domain/users/entities/user";
import { UserRepository } from "@/domain/users/repositories/user-repository";
import { Injectable } from "@nestjs/common";
import { Session } from "../entities/session";
import { SessionNotFoundError } from "../errors/session-not-found-error";
import { SessionRepository } from "../repositories/session-repository";

interface ValidateSessionUseCaseRequest {
  sessionId: string;
}

type ValidateSessionUseCaseResponse = Either<
  SessionNotFoundError,
  {
    session: Session;
    user: User;
  }
>;

@Injectable()
export class ValidateSessionUseCase implements UseCase<
  ValidateSessionUseCaseRequest,
  ValidateSessionUseCaseResponse
> {
  constructor(
    private sessionRepository: SessionRepository,
    private userRepository: UserRepository,
  ) {}

  async execute({
    sessionId,
  }: ValidateSessionUseCaseRequest): Promise<ValidateSessionUseCaseResponse> {
    const session = await this.sessionRepository.findById(sessionId);

    if (!session || session.isExpired) return left(new SessionNotFoundError());

    const user = await this.userRepository.findById(session.userId.toString());

    if (!user) return left(new SessionNotFoundError());

    session.renewIfNeeded();

    await this.sessionRepository.save(session);

    return right({ session, user });
  }
}
