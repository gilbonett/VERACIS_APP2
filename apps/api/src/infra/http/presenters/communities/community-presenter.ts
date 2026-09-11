import { Community } from '@/domain/communities/entities/community'

export class CommunityPresenter {
  static toHTTP(data: Community) {
    return {
      id: data.id.toString(),
      name: data.name,
      description: data.description,
      biomeId: data.biomeId.toString(),
      createdAt: data.createdAt,
    }
  }
}
