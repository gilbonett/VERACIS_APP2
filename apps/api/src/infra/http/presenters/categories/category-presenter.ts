import { Category } from "@/domain/categories/entities/category";

export class CategoryPresenter {
  static toHTTP(raw: Category) {
    return {
      id: raw.id.toString(),
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
