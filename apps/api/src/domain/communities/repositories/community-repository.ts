import { Repository } from '@/core/repositories/repository'
import { Community } from '../entities/community'

export interface IQueriesCommunityRepository {
  biomeId?: string
}

export abstract class CommunityRepository extends Repository<Community> {
  abstract findManyWithQueries(
    query: IQueriesCommunityRepository,
  ): Promise<Community[]>
}
