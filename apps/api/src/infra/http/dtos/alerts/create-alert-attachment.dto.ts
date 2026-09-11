import { createZodDto } from "nestjs-zod";
import z from "zod";

export class CreateAlertAttachmentDto extends createZodDto(
  z.object({
    attachmentId: z.uuid(),
    alertId: z.uuid(),
  }),
) {}
