import { Injectable } from '@nestjs/common'
import { Biome } from '../entities/biome'
import { BiomeRepository } from '../repositories/biome-repository'

@Injectable()
export class GetBiomesUseCase {
  constructor(private biomeRepository: BiomeRepository) {}

  async execute(): Promise<Biome[]> {
    const biomes = await this.biomeRepository.findAll()

    return biomes
  }
}
