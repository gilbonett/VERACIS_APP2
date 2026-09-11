import { GetBiomesUseCase } from "@/domain/common/use-cases/get-biomes-use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { GetBiomesDoc } from "../../docs/biomes/get-biomes.doc";
import { BiomePresenter } from "../../presenters/common/biome-presenter";

@Public()
@ApiTags(SWAGGER_TAGS.BIOMES)
@Controller("biomes")
export class GetBiomesController {
  constructor(private getBiomesUseCase: GetBiomesUseCase) {}

  @Get()
  @GetBiomesDoc()
  async handle() {
    const resuls = await this.getBiomesUseCase.execute();

    return {
      success: true,
      data: resuls.map(BiomePresenter.toHTTP),
    };
  }
}
