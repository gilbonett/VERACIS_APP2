import { Either, right } from "@/core/either";
import { UserRole } from "@/domain/users/entities/user";
import { ObserveBusiness } from "@/infra/telemetry/decorators/observe-business.decorator";
import { Injectable } from "@nestjs/common";
import { Alert } from "../entities/alert";
import { AlertRepository } from "../repositories/alert-repository";

interface CreateAlertUseCaseRequest {
  lat: number;
  lng: number;
  description?: string | null;
  authorId: string;
  communityId: string;
  categoryId: string;
  eventIds: string[];
  riskIds: string[];
  currentUserRole: UserRole;
}

type CreateAlertUseCaseResponse = Either<never, { alert: Alert }>;

@Injectable()
export class CreateAlertUseCase {
  constructor(private alertRepository: AlertRepository) {}

  @ObserveBusiness({ flow: "alert", action: "create" })
  async execute(
    data: CreateAlertUseCaseRequest,
  ): Promise<CreateAlertUseCaseResponse> {
    const alert = Alert.create(data);

    await this.alertRepository.create(alert);

    return right({
      alert,
    });
  }
}
