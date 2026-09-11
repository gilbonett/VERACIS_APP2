import { createZodDto } from "nestjs-zod";
import z from "zod";

export class UploadAndCreateAttachmentQueryDto extends createZodDto(
  z.object({
    scope: z.enum(["USER", "ALERT"]),
  }),
) {}
