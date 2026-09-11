import { CreateAlertAttachmentUseCase } from "@/domain/alerts/use-cases/create-alert-attachment.use-case";
import { SWAGGER_TAGS } from "@/infra/swagger/swagger-tags";
import { Body, Controller, Post } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CreateAlertAttachmentDoc } from "../../docs/alerts/create-alert-attachment.doc";
import { CreateAlertAttachmentDto } from "../../dtos/alerts/create-alert-attachment.dto";

@ApiTags(SWAGGER_TAGS.ALERTS)
@Controller("alerts/attachments")
export class CreateAlertAttachmentController {
  constructor(private alertAttachmentUseCase: CreateAlertAttachmentUseCase) {}

  @Post()
  @CreateAlertAttachmentDoc()
  async handle(@Body() body: CreateAlertAttachmentDto) {
    await this.alertAttachmentUseCase.execute(body);

    return {
      message: "Attachment created successfully",
    };
  }
}
