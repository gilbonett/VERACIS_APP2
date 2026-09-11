import { Either, left, right } from "@/core/either";
import { Injectable } from "@nestjs/common";
import { Attachment } from "../entities/attachment";
import { AttachmentNotFoundError } from "../errors/attachment-not-found-error";
import { AttachmentRepository } from "../repositories/attachment-repository";

type RemoveAttachmentUseCaseResponse = Either<
  AttachmentNotFoundError,
  { attachment: Attachment }
>;

@Injectable()
export class RemoveAttachmentUseCase {
  constructor(private attachmentRepository: AttachmentRepository) {}

  async execute(
    attachmentId: string,
  ): Promise<RemoveAttachmentUseCaseResponse> {
    const attachment = await this.attachmentRepository.findById(attachmentId);

    if (!attachment) return left(new AttachmentNotFoundError());

    attachment.registerAttachmentRemovedEvent();

    await this.attachmentRepository.delete(attachment);

    return right({ attachment });
  }
}
