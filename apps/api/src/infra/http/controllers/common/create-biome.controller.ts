import { CreateBiomeUseCase } from "@/domain/common/use-cases/create-biome";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { Public } from "../../decorators/public.decorator";
import { CreateBiomeDoc } from "../../docs/biomes/create-biome.doc";
import { CreateBiomeDto } from "../../dtos/common/create-biome.dto";

@Public()
@ApiTags(SWAGGER_TAGS.BIOMES)
@Controller("biomes")
export class CreateBiomeController {
  constructor(private createBiomeUseCase: CreateBiomeUseCase) {}

  @Post()
  @CreateBiomeDoc()
  async handle(@Body() body: CreateBiomeDto) {
    const result = await this.createBiomeUseCase.execute(body);

    const biome = result.value.biome;

    return {
      id: biome.id.toString(),
      name: biome.name,
      slug: biome.slug.value,
      description: biome.description,
    };
  }
}
