import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Injectable } from "@nestjs/common";
import { AlertAttachment } from "../entities/alert-attachment";
import { AlertAttachmentsRepository } from "../repositories/alert-attachments-repository";

interface CreateAlertAttachmentUseCaseRequest {
  attachmentId: string;
  alertId: string;
}

@Injectable()
export class CreateAlertAttachmentUseCase {
  constructor(
    private readonly attachmentRepository: AlertAttachmentsRepository,
  ) {}

  async execute({
    attachmentId,
    alertId,
  }: CreateAlertAttachmentUseCaseRequest) {
    const attachment = AlertAttachment.create({
      attachmentId: new UniqueEntityID(attachmentId),
      alertId: new UniqueEntityID(alertId),
    });

    await this.attachmentRepository.createMany([attachment]);
  }
}
