import { Injectable } from "@nestjs/common";
import { MembershipRepository } from "../repositories/membership-repository";

type GetUserIdsByCommunityIdUseCaseRequest = {
  communityId: string;
};

type GetUserIdsByCommunityIdUseCaseResponse = {
  userIds: string[];
};

@Injectable()
export class GetUserIdsByCommunityIdUseCase {
  constructor(private membershipRepository: MembershipRepository) {}

  async execute({
    communityId,
  }: GetUserIdsByCommunityIdUseCaseRequest): Promise<GetUserIdsByCommunityIdUseCaseResponse> {
    const memberships =
      await this.membershipRepository.findManyByCommunityId(communityId);

    const userIds = memberships.map((membership) =>
      membership.userId.toString(),
    );

    return { userIds };
  }
}
