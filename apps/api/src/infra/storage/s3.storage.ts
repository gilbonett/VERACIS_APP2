import {
  Uploader,
  UploadResult,
  type UploadParams,
} from "@/domain/storage/uploader";
import {
  DeleteObjectCommand,
  GetObjectCommand,
  PutObjectCommand,
  S3Client,
} from "@aws-sdk/client-s3";
import { Injectable } from "@nestjs/common";
import { Readable } from "node:stream";
import { EnvService } from "../env/env.service";
import { ObserveStorage } from "../telemetry/decorators/observe-storage.decorator";

@Injectable()
export class S3Storage implements Uploader {
  private client: S3Client;
  private readonly bucketName: string;
  private readonly serverAddress: string;

  constructor(private envService: EnvService) {
    this.bucketName = envService.get("AWS_BUCKET_NAME");

    const isProduction = envService.get("NODE_ENV") === "production";
    const region = envService.get("AWS_REGION");

    if (isProduction) {
      this.client = new S3Client({
        region,
      });
      this.serverAddress = "s3.amazonaws.com";
    } else {
      const endpoint = envService.get("AWS_ENDPOINT");
      const accessKeyId = envService.get("AWS_ACCESS_KEY_ID");
      const secretAccessKey = envService.get("AWS_SECRET_ACCESS_KEY");

      if (!endpoint || !accessKeyId || !secretAccessKey) {
        throw new Error("Missing Minio credentials");
      }

      this.client = new S3Client({
        region,
        endpoint,
        forcePathStyle: true, // needed for minio
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      });
      this.serverAddress = new URL(endpoint).host;
    }
  }

  @ObserveStorage({
    operation: "upload",
    bucket: (_, instance) => (instance as S3Storage).bucketName,
    fileType: (args) => (args[0] as UploadParams).fileType,
    size: (args) => (args[0] as UploadParams).body.length,
    serverAddress: (_, instance) => (instance as S3Storage).serverAddress,
  })
  async upload({
    fileName,
    fileType,
    body,
  }: UploadParams): Promise<{ url: string }> {
    const uniqueFileName = fileName;
    const bucketName = this.bucketName;

    await this.client.send(
      new PutObjectCommand({
        Bucket: bucketName,
        Key: uniqueFileName,
        ContentType: fileType,
        Body: body,
      }),
    );

    const apiUrl = this.envService.get("API_URL");

    return {
      url: `${apiUrl}/files/${encodeURIComponent(uniqueFileName)}`,
    };
  }

  @ObserveStorage({
    operation: "get_file",
    bucket: (_, instance) => (instance as S3Storage).bucketName,
    fileType: () => "application/octet-stream",
    size: (_args, result) => (result as UploadResult).contentLength,
    serverAddress: (_, instance) => (instance as S3Storage).serverAddress,
  })
  async getFile(
    fileName: string,
    abortSignal?: AbortSignal,
  ): Promise<UploadResult> {
    const response = await this.client.send(
      new GetObjectCommand({
        Bucket: this.bucketName,
        Key: fileName,
      }),
      { abortSignal },
    );

    return {
      stream: response.Body as Readable,
      contentType: response.ContentType ?? "application/octet-stream",
      contentLength: response.ContentLength ?? 0,
    };
  }

  @ObserveStorage({
    operation: "delete",
    bucket: (_, instance) => (instance as S3Storage).bucketName,
    fileType: () => "application/octet-stream",
    size: () => 0,
    serverAddress: (_, instance) => (instance as S3Storage).serverAddress,
  })
  async delete(fileKey: string): Promise<void> {
    await this.client.send(
      new DeleteObjectCommand({
        Bucket: this.bucketName,
        Key: fileKey,
      }),
    );
  }
}
