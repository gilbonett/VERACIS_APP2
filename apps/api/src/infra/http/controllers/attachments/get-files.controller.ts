import { GetAttachmentUseCase } from "@/domain/attachments/use-cases/get-attachment.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  Controller,
  Get,
  Header,
  Param,
  Req,
  StreamableFile,
} from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import type { Request } from "express";
import { Public } from "../../decorators/public.decorator";
import { GetFilesDoc } from "../../docs/attachments/get-files.doc";

// localhost:3333/files/user/<user_id>.png

@Public()
@ApiTags(SWAGGER_TAGS.FILES)
@Controller("files/:fileName")
export class GetFilesController {
  constructor(private attachment: GetAttachmentUseCase) {}

  @Get()
  @Header("Cache-Control", "public, max-age=31536000")
  @GetFilesDoc()
  async handle(@Req() req: Request, @Param("fileName") fileName: string) {
    const abortController = new AbortController();
    req.on("close", () => abortController.abort());

    const { stream, contentType, contentLength } =
      await this.attachment.execute({ fileName });

    return new StreamableFile(stream, {
      type: contentType,
      length: contentLength,
      disposition: `inline; filename="${fileName.split("/").pop()}"`,
    });
  }
}
