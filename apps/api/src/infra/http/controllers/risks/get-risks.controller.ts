import { GetRisksUseCase } from "@/domain/risks/use-cases/get-risks.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetRisksDoc } from "../../docs/risks/get-risks.doc";
import { RiskPresenter } from "../../presenters/risks/risk-presenter";

@ApiTags(SWAGGER_TAGS.RISKS)
@Controller("risks")
export class GetRisksController {
  constructor(private getRisksUseCase: GetRisksUseCase) {}

  @Get()
  @GetRisksDoc()
  async handle() {
    const result = await this.getRisksUseCase.execute();

    const risks = result.value.risks;

    return risks.map(RiskPresenter.toHTTP);
  }
}
