import { AttachmentRemovedEvent } from "@/domain/attachments/events/attachment-removed-event";
import { Uploader } from "@/domain/storage/uploader";
import { Injectable } from "@nestjs/common";
import { OnEvent } from "../shared";

@Injectable()
export class OnAttachmentRemoved {
  constructor(private uploader: Uploader) {}

  @OnEvent(AttachmentRemovedEvent)
  async handle({ payload }: AttachmentRemovedEvent) {
    await this.uploader.delete(payload.fileKey);
  }
}
