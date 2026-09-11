import { Either, left, right } from "@/core/either";
import { UserNotFoundError } from "@/domain/users/errors/user-not-found-error";
import { UserRepository } from "@/domain/users/repositories/user-repository";
import { Injectable } from "@nestjs/common";
import { AlertMetrics } from "../entities/alert-metrics";
import { AlertMetricsRepository } from "../repositories/alert-metrics-repository";

interface GetAlertMetricsByCommunityIdUseCaseRequest {
  currentUserId: string;
}

type GetAlertMetricsByCommunityIdUseCaseResponse = Either<
  UserNotFoundError,
  {
    metrics: AlertMetrics;
  }
>;

@Injectable()
export class GetAlertMetricsByCommunityIdUseCase {
  constructor(
    private userRepository: UserRepository,
    private alertMetricsRepository: AlertMetricsRepository,
  ) {}

  async execute({
    currentUserId,
  }: GetAlertMetricsByCommunityIdUseCaseRequest): Promise<GetAlertMetricsByCommunityIdUseCaseResponse> {
    const user = await this.userRepository.findById(currentUserId);

    if (!user) {
      return left(new UserNotFoundError());
    }

    const communityId = user.communities.currentItems[0].communityId;

    const metrics = await this.alertMetricsRepository.findByCommunityId(
      communityId.toString(),
    );

    return right({ metrics });
  }
}
