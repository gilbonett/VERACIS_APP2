import { Biome } from '@/domain/common/entities/biome'

export class BiomePresenter {
  static toHTTP(raw: Biome) {
    return {
      id: raw.id.toString(),
      name: raw.name,
      description: raw.description,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    }
  }
}
