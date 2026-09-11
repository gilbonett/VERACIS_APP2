import { Either, left, right } from "@/core/either";
import { UseCase } from "@/core/use-case";
import { Injectable } from "@nestjs/common";
import { OtpAlreadyEnabledError } from "../errors/otp-already-enabled-error";
import { UserNotFoundError } from "../errors/user-not-found-error";
import { UserRepository } from "../repositories/user-repository";

interface EnableOtpUseCaseRequest {
  userId: string;
}

type EnableOtpUseCaseResponse = Either<
  UserNotFoundError | OtpAlreadyEnabledError,
  void
>;

@Injectable()
export class EnableOtpUseCase implements UseCase<
  EnableOtpUseCaseRequest,
  EnableOtpUseCaseResponse
> {
  constructor(private readonly userRepository: UserRepository) {}

  async execute({
    userId,
  }: EnableOtpUseCaseRequest): Promise<EnableOtpUseCaseResponse> {
    const user = await this.userRepository.findById(userId);
    if (!user) return left(new UserNotFoundError());

    if (user.otpEnabled) return left(new OtpAlreadyEnabledError());

    user.enableOtp();
    // user.addDomainEvent(new UserMfaStateChanged(user.id, true));

    await this.userRepository.save(user);

    return right(undefined);
  }
}
