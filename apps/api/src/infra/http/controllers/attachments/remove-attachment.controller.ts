import { RemoveAttachmentUseCase } from "@/domain/attachments/use-cases/remove-attachment.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Controller, Delete, NotFoundException, Param } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";

@ApiTags(SWAGGER_TAGS.FILES)
@Controller("attachment/:attachmentId")
export class RemoveAttachmentController {
  constructor(private removeAttachment: RemoveAttachmentUseCase) {}

  @Delete()
  async handle(@Param("attachmentId") attachmentId: string) {
    const result = await this.removeAttachment.execute(attachmentId);

    if (result.isLeft()) {
      throw new NotFoundException(result.value.message);
    }
  }
}
