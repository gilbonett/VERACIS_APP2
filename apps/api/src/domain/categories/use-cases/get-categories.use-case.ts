import { Injectable } from "@nestjs/common";
import { Category } from "../entities/category";
import { CategoryRepository } from "../repositories/category-repository";

@Injectable()
export class GetCategoriesUseCase {
  constructor(private readonly categoryRepository: CategoryRepository) {}

  async execute(): Promise<Category[]> {
    return this.categoryRepository.findAll();
  }
}
