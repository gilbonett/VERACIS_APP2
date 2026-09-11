import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserRole } from "@/domain/users/entities/user";
import { Injectable } from "@nestjs/common";
import { AlertComment } from "../entities/alert-comment";
import { AlertNotFoundError } from "../errors/alert-not-found-error";
import { canViewHealthAlert } from "@/domain/alerts/policies/health-alert-visibility";
import { AlertCommentRepository } from "../repositories/alert-comment-repository";
import { AlertDetailsRepository } from "../repositories/alert-details-repository";

type CreateAlertCommentUseCaseRequest = {
  alertId: string;
  authorId: string;
  currentUserRole: UserRole;
  content: string;
};

type CreateAlertCommentUseCaseResponse = Either<
  AlertNotFoundError,
  {
    comment: AlertComment;
  }
>;

@Injectable()
export class CreateAlertCommentUseCase {
  constructor(
    private alertCommentRepository: AlertCommentRepository,
    private alertDetailsRepository: AlertDetailsRepository,
  ) {}

  async execute({
    alertId,
    authorId,
    currentUserRole,
    content,
  }: CreateAlertCommentUseCaseRequest): Promise<CreateAlertCommentUseCaseResponse> {
    const alert = await this.alertDetailsRepository.findById(alertId, authorId);

    if (!alert) {
      return left(new AlertNotFoundError());
    }

    if (
      !canViewHealthAlert({
        alert,
        currentUserId: authorId,
        currentUserRole,
      })
    ) {
      return left(new AlertNotFoundError());
    }

    const comment = AlertComment.create({
      alertId: new UniqueEntityID(alertId),
      authorId: new UniqueEntityID(authorId),
      content,
    });

    await this.alertCommentRepository.create(comment);

    return right({
      comment,
    });
  }
}
