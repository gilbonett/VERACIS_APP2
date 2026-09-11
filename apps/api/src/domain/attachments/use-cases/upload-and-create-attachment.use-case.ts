import { Either, left, right } from "@/core/either";
import { UniqueEntityID } from "@/core/entities/unique-entity-id";
import { Uploader } from "@/domain/storage/uploader";
import { Injectable } from "@nestjs/common";
import { Attachment, AttachmentScope } from "../entities/attachment";
import { InvalidAttachmentTypeError } from "../errors/invalid-attachment-type-error";
import { AttachmentRepository } from "../repositories/attachment-repository";
import { FileSize } from "../value-objects/file-size";
import { MimeType } from "../value-objects/mime-type";

type UploadAndCreateAttachmentUseCaseRequest = {
  scope: AttachmentScope;
  fileType: string;
  fileSize: number;
  body: Buffer;
  userId: string;
};

const SCOPE_PATH: Record<AttachmentScope, string> = {
  USER: "users",
  ALERT: "alert",
};

type UploadAndCreateAttachmentUseCaseResponse = Either<
  InvalidAttachmentTypeError,
  {
    attachment: Attachment;
  }
>;

@Injectable()
export class UploadAndCreateAttachmentUseCase {
  constructor(
    private attachmentRepository: AttachmentRepository,
    private uploader: Uploader,
  ) {}

  async execute(
    data: UploadAndCreateAttachmentUseCaseRequest,
  ): Promise<UploadAndCreateAttachmentUseCaseResponse> {
    const mimeType = MimeType.create(data.fileType);

    if (!mimeType) {
      return left(new InvalidAttachmentTypeError(data.fileType));
    }

    const attachmentId = new UniqueEntityID();
    const fileName = `${attachmentId.toString()}${mimeType.fullExtension}`;
    const path = SCOPE_PATH[data.scope];
    const fullName = `${path}/${fileName}`;

    const fileSize = FileSize.create(data.fileSize);

    const { url } = await this.uploader.upload({
      fileName: fullName,
      fileType: data.fileType,
      body: data.body,
    });

    const attachment = Attachment.create(
      {
        url,
        fileName,
        fileType: data.fileType,
        fileSize: fileSize.inBytes,
        path,
        scope: data.scope,
      },
      attachmentId,
    );

    await this.attachmentRepository.create(attachment);

    return right({
      attachment,
    });
  }
}
