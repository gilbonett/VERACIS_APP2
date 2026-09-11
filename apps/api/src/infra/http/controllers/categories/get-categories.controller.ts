import { GetCategoriesUseCase } from "@/domain/categories/use-cases/get-categories.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Get } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { GetCategoriesDoc } from "../../docs/categories/get-categories.doc";
import { CategoryPresenter } from "../../presenters/categories/category-presenter";

@ApiTags(SWAGGER_TAGS.CATEGORIES)
@Controller("categories")
export class GetCategoriesController {
  constructor(private getCategoriesUseCase: GetCategoriesUseCase) {}

  @Get()
  @GetCategoriesDoc()
  async handle() {
    const categories = await this.getCategoriesUseCase.execute();

    return categories.map(CategoryPresenter.toHTTP);
  }
}
