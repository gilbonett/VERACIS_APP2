import { InMemoryBiomeRepository } from "../../../../test/repositories/in-memory-biome-repository";
import { Biome } from "../entities/biome";
import { GetBiomesUseCase } from "./get-biomes-use-case";

let inMemoryBiomeRepository: InMemoryBiomeRepository;
let sut: GetBiomesUseCase;

describe("Get Biomes", () => {
  beforeEach(() => {
    inMemoryBiomeRepository = new InMemoryBiomeRepository();
    sut = new GetBiomesUseCase(inMemoryBiomeRepository);
  });

  it("returns empty array when there are no biomes", async () => {
    const result = await sut.execute();
    expect(result).toEqual([]);
  });

  it("returns all biomes from repository", async () => {
    const biome = Biome.toCreate({ name: "Test Biome" });
    await inMemoryBiomeRepository.create(biome);

    const result = await sut.execute();

    expect(result).toHaveLength(1);
    expect(result[0].name).toBe("Test Biome");
  });
});
