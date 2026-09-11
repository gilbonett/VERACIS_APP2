import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Biome, BiomeProps } from "@/domain/common/entities/biome";
import { Slug } from "@/domain/common/value-objects/slug-vo";

export function makeBiome(
  override: Partial<BiomeProps> = {},
  id?: UniqueEntityID,
): Biome {
  const biome = Biome.toCreate(
    {
      name: override.name ?? "Sample Biome",
      slug: override.name
        ? Slug.createFromText(override.name)
        : Slug.createFromText("Sample Biome"),
      ...override,
    },
    id,
  );

  return biome;
}
