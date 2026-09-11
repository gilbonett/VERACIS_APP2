import { Biome } from "@/domain/common/entities/biome";
import { BiomeRepository } from "@/domain/common/repositories/biome-repository";
import { Injectable } from "@nestjs/common";
import { PrismaService } from "../../prisma.service";
import { PrismaBiomeMapper } from "../mappers/prisma-biome-mapper";

@Injectable()
export class PrismaBiomeRepository implements BiomeRepository {
  constructor(private prisma: PrismaService) {}

  async create(biome: Biome): Promise<void> {
    const data = PrismaBiomeMapper.toPrisma(biome);

    await this.prisma.biome.create({ data });
  }

  async findById(id: string): Promise<Biome | null> {
    const biome = await this.prisma.biome.findUnique({
      where: { id },
    });

    if (!biome) {
      return null;
    }

    return PrismaBiomeMapper.toDomain(biome);
  }

  async findAll(): Promise<Biome[]> {
    const biomes = await this.prisma.biome.findMany();

    return biomes.map(PrismaBiomeMapper.toDomain);
  }

  async save(biome: Biome): Promise<void> {
    const data = PrismaBiomeMapper.toPrisma(biome);

    await this.prisma.biome.update({
      where: { id: data.id },
      data,
    });
  }

  async delete(biome: Biome): Promise<void> {
    await this.prisma.biome.delete({
      where: { id: biome.id.toString() },
    });
  }
}
