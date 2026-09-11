import { CreateRiskUseCase } from "@/domain/risks/use-cases/create-risk.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { BadRequestException, Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateRiskDoc } from "../../docs/risks/create-risk.doc";
import { CreateRiskDto } from "../../dtos/risks/create-risk.dto";

@ApiTags(SWAGGER_TAGS.RISKS)
@Controller("risks")
export class CreateRiskController {
  constructor(private createRiskUseCase: CreateRiskUseCase) {}

  @Post()
  @CreateRiskDoc()
  async handle(@Body() body: CreateRiskDto) {
    const result = await this.createRiskUseCase.execute(body);

    if (result.isLeft()) {
      throw new BadRequestException(result.value.message);
    }

    return {
      message: "Risk created successfully",
    };
  }
}
