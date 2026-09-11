import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import {
  AlertReaction,
  AlertReactionProps,
} from "@/domain/alerts/entities/alert-reaction";

export function makeAlertReaction(
  override: Partial<AlertReactionProps> = {},
  id?: UniqueEntityID,
): AlertReaction {
  return AlertReaction.reconstitute(
    {
      type: override.type ?? "LIKE",
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? new Date(),
      alertId: override.alertId ?? new UniqueEntityID(),
      authorId: override.authorId ?? new UniqueEntityID(),
    },
    id ?? new UniqueEntityID(),
  );
}
