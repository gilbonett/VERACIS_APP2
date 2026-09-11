import { Injectable } from '@nestjs/common'
import { CommunityRepository } from '../repositories/community-repository'

type GetCommunitiesUseCaseRequest = {
  biomeId?: string
}

@Injectable()
export class GetCommunitiesUseCase {
  constructor(private communityRepository: CommunityRepository) {}

  async execute({ biomeId }: GetCommunitiesUseCaseRequest) {
    const communities = await this.communityRepository.findManyWithQueries({
      biomeId,
    })

    return communities
  }
}
