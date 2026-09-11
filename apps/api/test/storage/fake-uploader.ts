import { Uploader, UploadParams } from "@/domain/storage/uploader";
import { Readable } from "node:stream";

interface Upload {
  fileName: string;
  url: string;
}

export class FakeUploader implements Uploader {
  public uploads: Upload[] = [];

  async upload({ fileName }: UploadParams): Promise<{ url: string }> {
    const url = `https://fake-storage.test/${fileName}`;

    this.uploads.push({ fileName, url });

    return { url };
  }

  async getFile(
    fileName: string,
  ): Promise<{ stream: Readable; contentType: string; contentLength: number }> {
    const content = `fake-content-for-${fileName}`;

    return {
      stream: Readable.from([content]),
      contentType: "application/octet-stream",
      contentLength: Buffer.byteLength(content),
    };
  }

  async delete(fileKey: string): Promise<void> {
    this.uploads = this.uploads.filter((upload) => upload.fileName !== fileKey);
  }
}
