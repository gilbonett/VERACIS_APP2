import { Readable } from "node:stream";

export interface UploadParams {
  fileName: string;
  fileType: string;
  body: Buffer;
}

export interface UploadResult {
  stream: Readable;
  contentType: string;
  contentLength: number;
}

export abstract class Uploader {
  abstract upload(params: UploadParams): Promise<{ url: string }>;
  abstract delete(fileKey: string): Promise<void>;
  abstract getFile(
    fileName: string,
    abortSignal?: AbortSignal,
  ): Promise<UploadResult>;
}
