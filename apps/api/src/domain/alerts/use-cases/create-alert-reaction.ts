import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { memberSingleClickLikeConfirmsAlert } from "@/domain/alerts/policies/single-click-alert-confirmation";
import { canViewHealthAlertByCategory } from "@/domain/alerts/policies/health-alert-visibility";
import { UserRole } from "@/domain/users/entities/user";
import { MembershipRepository } from "@/domain/users/repositories/membership-repository";
import { Injectable } from "@nestjs/common";
import { AlertReaction } from "../entities/alert-reaction";
import { AlertNotFoundError } from "../errors/alert-not-found-error";
import { AlertNotOpenForReactionsError } from "../errors/alert-not-open-for-reactions-error";
import { ReactionAlreadyExistsError } from "../errors/reaction-already-exists-error";
import { AlertReactionRepository } from "../repositories/alert-reaction-repository";
import { AlertRepository } from "../repositories/alert-repository";

interface CreateAlertReactionUseCaseRequest {
  type: "LIKE" | "DISLIKE";
  authorId: string;
  alertId: string;
  currentUserRole: UserRole;
}

type CreateAlertReactionUseCaseResponse = Either<
  | AlertNotFoundError
  | AlertNotOpenForReactionsError
  | ReactionAlreadyExistsError,
  { reaction: AlertReaction }
>;

@Injectable()
export class CreateAlertReactionUseCase {
  constructor(
    private alertReactionRepository: AlertReactionRepository,
    private membershipRepository: MembershipRepository,
    private alertRepository: AlertRepository,
  ) {}

  async execute({
    type,
    authorId,
    alertId,
    currentUserRole,
  }: CreateAlertReactionUseCaseRequest): Promise<CreateAlertReactionUseCaseResponse> {
    const alert = await this.alertRepository.findById(alertId);

    if (!alert) {
      return left(new AlertNotFoundError());
    }

    if (alert.status !== "PENDING") {
      return left(new AlertNotOpenForReactionsError());
    }

    if (
      !canViewHealthAlertByCategory({
        categoryId: alert.categoryId.toString(),
        authorId: alert.authorId.toString(),
        currentUserId: authorId,
        currentUserRole,
      })
    ) {
      return left(new AlertNotFoundError());
    }

    const reaction =
      await this.alertReactionRepository.findByAlertIdAndAuthorId(
        alertId,
        authorId,
      );

    if (reaction) {
      return left(new ReactionAlreadyExistsError());
    }

    const newReaction = AlertReaction.create({
      type,
      alertId: new UniqueEntityID(alertId),
      authorId: new UniqueEntityID(authorId),
      communityId: alert.communityId,
      currentUserRole,
    });

    await this.alertReactionRepository.create(newReaction);

    if (currentUserRole !== "MEMBER") {
      alert.doAccept();
      await this.alertRepository.save(alert);

      return right({ reaction: newReaction });
    }

    if (type === "LIKE" && memberSingleClickLikeConfirmsAlert(authorId)) {
      alert.doAccept();
      await this.alertRepository.save(alert);

      return right({ reaction: newReaction });
    }

    const reactionTotalLikes =
      await this.alertReactionRepository.findCountByAlertIdAndLiked(
        alertId.toString(),
      );

    const minimumToConfirm = 5;
    const alertConfirmed = reactionTotalLikes >= minimumToConfirm;

    if (alertConfirmed) {
      alert.doAccept();

      await this.alertRepository.save(alert);
    }

    return right({ reaction: newReaction });
  }
}
