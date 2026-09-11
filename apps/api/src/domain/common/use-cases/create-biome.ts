import { Either, right } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { Biome } from "../entities/biome";
import { BiomeRepository } from "../repositories/biome-repository";

type CreateBiomeUseCaseRequest = {
  name: string;
  description?: string | null;
};

type CreateBiomeUseCaseResponse = Either<never, { biome: Biome }>;

@Injectable()
export class CreateBiomeUseCase {
  constructor(private biomeRepository: BiomeRepository) {}

  async execute(
    request: CreateBiomeUseCaseRequest,
  ): Promise<CreateBiomeUseCaseResponse> {
    const biome = Biome.toCreate({
      name: request.name,
      description: request.description,
    });

    await this.biomeRepository.create(biome);

    return right({ biome });
  }
}
