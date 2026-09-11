import { WatchedList } from "@/core/entities/watched-list";
import { AlertAttachment } from "./alert-attachment";

export class AlertAttachmentList extends WatchedList<AlertAttachment> {
  compareItems(a: AlertAttachment, b: AlertAttachment): boolean {
    return a.attachmentId.equals(b.attachmentId);
  }
}
