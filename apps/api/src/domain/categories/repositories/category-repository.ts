import { Repository } from "@/core/repositories/repository";
import { Category } from "../entities/category";

export abstract class CategoryRepository extends Repository<Category> {}
