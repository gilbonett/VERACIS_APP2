import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Alert, AlertProps } from "@/domain/alerts/entities/alert";
import { AlertAttachmentList } from "@/domain/alerts/entities/alert-attachment-list";
import { AlertEventList } from "@/domain/alerts/entities/alert-event-list";
import { AlertRiskList } from "@/domain/alerts/entities/alert-risk-list";

export function makeAlert(
  override: Partial<AlertProps> = {},
  id?: UniqueEntityID,
): Alert {
  const alert = Alert.reconstitute(
    {
      status: override.status ?? "PENDING",
      description: override.description ?? null,
      lat: override.lat ?? 0,
      lng: override.lng ?? 0,
      createdAt: override.createdAt ?? new Date(),
      updatedAt: override.updatedAt ?? new Date(),
      categoryId: override.categoryId ?? new UniqueEntityID(),
      authorId: override.authorId ?? new UniqueEntityID(),
      communityId: override.communityId ?? new UniqueEntityID(),
      attachments: override.attachments ?? new AlertAttachmentList(),
      events: override.events ?? new AlertEventList(),
      risks: override.risks ?? new AlertRiskList(),
    },
    id ?? new UniqueEntityID(),
  );

  console.log("makeAlert", alert);
  return alert;
}
