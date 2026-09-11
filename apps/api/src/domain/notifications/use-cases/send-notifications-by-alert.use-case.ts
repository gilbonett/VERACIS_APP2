import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { CategoryNotFoundError } from "@/domain/categories/errors/category-not-found-error";
import { CategoryRepository } from "@/domain/categories/repositories/category-repository";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";
import { Injectable } from "@nestjs/common";
import { Notification } from "../entities/notification";
import { RecipientsNotFoundError } from "../errors/recipients-not-found-error";
import { NotificationRepository } from "../repositories/notification-repository";

type SendNotificationsByAlertUseCaseRequest = {
  communityId: string;
  alertId: string;
  authorId: string;
  categoryId: string;
};

type SendNotificationsByAlertUseCaseResponse = Either<
  RecipientsNotFoundError | CategoryNotFoundError,
  {
    notifications: Notification[];
  }
>;

@Injectable()
export class SendNotificationsByAlertUseCase {
  constructor(
    private notificationRepository: NotificationRepository,
    private categoryRepository: CategoryRepository,
    private membershipRepository: MembershipRepository,
  ) {}

  async execute({
    communityId,
    alertId,
    authorId,
    categoryId,
  }: SendNotificationsByAlertUseCaseRequest): Promise<SendNotificationsByAlertUseCaseResponse> {
    const memberships =
      await this.membershipRepository.findManyByCommunityId(communityId);

    if (memberships.length === 0) {
      return left(new RecipientsNotFoundError());
    }

    const recipientIds = memberships.map((membership) =>
      membership.userId.toString(),
    );

    const category = await this.categoryRepository.findById(categoryId);

    if (!category) {
      return left(new CategoryNotFoundError());
    }

    const notifications = Notification.createMany(
      recipientIds.map((recipientId) => ({
        scope: "ALERT" as const,
        title: `Alerta Confirmado pela Comunidade.`,
        content: `O alerta de ${category.name} foi confirmado por sua comunidade. Fique atento!`,
        alertId: new UniqueEntityID(alertId),
        authorId: new UniqueEntityID(authorId),
        recipientId: new UniqueEntityID(recipientId),
      })),
    );

    await this.notificationRepository.createMany(notifications);

    return right({ notifications });
  }
}
