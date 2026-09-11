import { UploadAndCreateAttachmentUseCase } from "@/domain/attachments/use-cases/upload-and-create-attachment.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import {
  BadRequestException,
  Controller,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from "@nestjs/common";
import { FileInterceptor } from "@nestjs/platform-express";
import { ApiTags } from "@nestjs/swagger";
import {
  CurrentSession,
  type ICurrentSession,
} from "../../decorators/current-session";
import { UploadAndCreateAttachmentDoc } from "../../docs/attachments/upload-and-create-attachment.doc";
import { UploadAndCreateAttachmentQueryDto } from "../../dtos/attachments/upload-and-create-attachment.dto";

@ApiTags(SWAGGER_TAGS.FILES)
@Controller("attachments")
export class UploadAndCreateAttachmentController {
  constructor(
    private uploadAndCreateAttachmentUseCase: UploadAndCreateAttachmentUseCase,
  ) {}

  @Post()
  @UseInterceptors(
    FileInterceptor("file", { limits: { fileSize: 10 * 1024 * 1024 } }),
  )
  @UploadAndCreateAttachmentDoc()
  async handle(
    @Query() query: UploadAndCreateAttachmentQueryDto,
    @UploadedFile() file: Express.Multer.File,
    @CurrentSession() { userId }: ICurrentSession,
  ) {
    if (!file?.buffer) {
      throw new BadRequestException(
        "Arquivo não recebido. Envie o campo multipart `file` ou verifique o proxy.",
      );
    }

    const result = await this.uploadAndCreateAttachmentUseCase.execute({
      ...query,
      fileType: file.mimetype,
      fileSize: file.size,
      body: file.buffer,
      userId,
    });

    if (result.isLeft()) {
      const error = result.value;

      throw new BadRequestException(error.message);
    }

    const { attachment } = result.value;

    return {
      attachmentId: attachment.id.toString(),
      url: attachment.url,
    };
  }
}
