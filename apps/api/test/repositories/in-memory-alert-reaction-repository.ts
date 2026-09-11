import { AlertReaction } from "@/domain/alerts/entities/alert-reaction";
import { AlertReactionRepository } from "@/domain/alerts/repositories/alert-reaction-repository";

export class InMemoryAlertReactionRepository implements AlertReactionRepository {
  public items: AlertReaction[] = [];

  async findCountByAlertIdAndLiked(alertId: string): Promise<number> {
    return this.items.filter(
      (item) => item.alertId.toString() === alertId && item.type === "LIKE",
    ).length;
  }

  async findByAlertIdAndAuthorId(
    alertId: string,
    authorId: string,
  ): Promise<AlertReaction | null> {
    const result = this.items.find(
      (item) =>
        item.alertId.toString() === alertId &&
        item.authorId.toString() === authorId,
    );

    if (!result) return null;

    return result;
  }

  async create(reaction: AlertReaction): Promise<void> {
    this.items.push(reaction);
  }

  async findById(id: string): Promise<AlertReaction | null> {
    const result = this.items.find((item) => item.id.toString() === id);

    if (!result) return null;

    return result;
  }

  async findAll(): Promise<AlertReaction[]> {
    return this.items;
  }

  async save(entity: AlertReaction): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === entity.id.toString(),
    );

    if (index !== -1) {
      this.items[index] = entity;
    } else {
      this.items.push(entity);
    }
  }

  async delete(entity: AlertReaction): Promise<void> {
    const index = this.items.findIndex(
      (item) => item.id.toString() === entity.id.toString(),
    );

    if (index !== -1) {
      this.items.splice(index, 1);
    }
  }
}
