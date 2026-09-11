import { createZodDto } from "nestjs-zod";
import z from "zod";

const alertComment = z.object({
  alertId: z.string(),
  content: z.string(),
});

export class BodyAlertCommentDto extends createZodDto(alertComment) {}
