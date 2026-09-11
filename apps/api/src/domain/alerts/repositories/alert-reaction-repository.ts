import { Repository } from "@/core/repositories/repository";
import { AlertReaction } from "../entities/alert-reaction";

export abstract class AlertReactionRepository extends Repository<AlertReaction> {
  abstract findCountByAlertIdAndLiked(alertId: string): Promise<number>;
  abstract findByAlertIdAndAuthorId(
    alertId: string,
    authorId: string,
  ): Promise<AlertReaction | null>;
}
