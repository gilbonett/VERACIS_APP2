import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { UserTerms } from "@/domain/users/entities/user-terms";
import { UserTermsAcceptedEvent } from "@/domain/users/events/user-terms-accepted-event";
import { UserTermsRepository } from "@/domain/users/repositories/user-terms-repository";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnUserTermsAccepted {
  constructor(private userTerms: UserTermsRepository) {}

  @OnEvent(UserTermsAcceptedEvent)
  async handle(event: UserTermsAcceptedEvent) {
    const { termsId, userId, ipAddress, userAgent } = event.payload;

    const newTermsAccepted = UserTerms.create(
      new UniqueEntityID(userId),
      new UniqueEntityID(termsId),
      ipAddress,
      userAgent,
    );

    await this.userTerms.create(newTermsAccepted);
  }
}
