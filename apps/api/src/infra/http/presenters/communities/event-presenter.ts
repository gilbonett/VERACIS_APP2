import { Event } from "@/domain/communities/entities/event";

export class EventPresenter {
  static toHTTP(raw: Event) {
    return {
      id: raw.id.toString(),
      name: raw.name,
      description: raw.description,
      icon: raw.icon,
      categoryId: raw.categoryId.toString(),
      slug: raw.slug.value,
      createdAt: raw.createdAt,
      updatedAt: raw.updatedAt,
    };
  }
}
