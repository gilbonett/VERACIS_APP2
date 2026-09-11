import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";
import { Injectable } from "@nestjs/common";
import { Notification } from "../entities/notification";
import { RecipientsNotFoundError } from "../errors/recipients-not-found-error";
import { NotificationRepository } from "../repositories/notification-repository";

interface SendNotificationsByUserUseCaseRequest {
  userId: string;
  name: string;
  communityIds: string[];
}

type SendNotificationsByUserUseCaseResponse = Either<
  RecipientsNotFoundError,
  {
    notifications: Notification[];
  }
>;

@Injectable()
export class SendNotificationsByUserUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private memberships: MembershipRepository,
  ) {}

  async execute(
    request: SendNotificationsByUserUseCaseRequest,
  ): Promise<SendNotificationsByUserUseCaseResponse> {
    const { userId, name, communityIds } = request;

    const memberships = await this.memberships.findManyByCommunityIdsAndLeader(
      communityIds.map((id) => id.toString()),
    );

    if (memberships.length === 0) return left(new RecipientsNotFoundError());

    const recipientIds = memberships.map((membership) =>
      membership.userId.toString(),
    );

    const notifications = recipientIds.map((recipientId) =>
      Notification.create({
        scope: "USER",
        title: "Novo Membro na Comunidade",
        content: `${name} acaba de entrar na sua comunidade.`,
        authorId: new UniqueEntityID(userId),
        recipientId: new UniqueEntityID(recipientId),
      }),
    );

    await this.notificationRepository.createMany(notifications);

    return right({ notifications });
  }
}
