import { Biome } from "@/domain/common/entities/biome";
import { BiomeRepository } from "@/domain/common/repositories/biome-repository";

export class InMemoryBiomeRepository implements BiomeRepository {
  public items: Biome[] = [];

  async create(biome: Biome): Promise<void> {
    this.items.push(biome);
  }

  async findById(id: string): Promise<Biome | null> {
    const biome = this.items.find((item) => item.id.toString() === id);

    if (!biome) return null;

    return biome;
  }
  async findAll(): Promise<Biome[]> {
    return this.items;
  }

  async save(biome: Biome): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === biome.id.toString(),
    );

    if (index === -1) {
      this.items.push(biome);
    } else {
      this.items[index] = biome;
    }
  }

  async delete(biome: Biome): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === biome.id.toString(),
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
