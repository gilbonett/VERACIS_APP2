import { UseCase } from "@/core/use-case";
import { Uploader } from "@/domain/storage/uploader";
import { Injectable, NotFoundException } from "@nestjs/common";
import { Readable } from "node:stream";

const SAFE_FILE_NAME = /^[a-zA-Z0-9_\-./]+$/;

type GetAttachmentUseCaseRequest = {
  fileName: string;
  abortSignal?: AbortSignal;
};

type GetAttachmentUseCaseResponse = {
  stream: Readable;
  contentType: string;
  contentLength: number;
};

@Injectable()
export class GetAttachmentUseCase implements UseCase<
  GetAttachmentUseCaseRequest,
  GetAttachmentUseCaseResponse
> {
  constructor(private uploader: Uploader) {}

  async execute(
    data: GetAttachmentUseCaseRequest,
  ): Promise<GetAttachmentUseCaseResponse> {
    if (
      !SAFE_FILE_NAME.test(data.fileName) ||
      data.fileName.includes("..") ||
      data.fileName.startsWith("/")
    ) {
      throw new NotFoundException("Arquivo não encontrado.");
    }

    const file = await this.uploader.getFile(data.fileName, data.abortSignal);

    return {
      stream: file.stream,
      contentType: file.contentType,
      contentLength: file.contentLength,
    };
  }
}
