import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { DomainEvent } from "@/core/events/domain-event";

interface AttachmentRemovedEventPayload {
  attachmentId: string;
  fileKey: string;
}

export class AttachmentRemovedEvent
  implements DomainEvent<AttachmentRemovedEventPayload>
{
  static readonly EVENT_NAME = "AttachmentRemovedEvent";

  public readonly ocurredAt: Date;
  public readonly payload: AttachmentRemovedEventPayload;

  constructor(payload: AttachmentRemovedEventPayload) {
    this.ocurredAt = new Date();
    this.payload = payload;
  }

  getName(): string {
    return AttachmentRemovedEvent.EVENT_NAME;
  }

  getAggregateId(): UniqueEntityID {
    return new UniqueEntityID(this.payload.attachmentId);
  }
}
