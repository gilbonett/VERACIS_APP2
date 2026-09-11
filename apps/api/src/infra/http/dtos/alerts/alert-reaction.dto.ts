import { createZodDto } from "nestjs-zod";
import z from "zod";

const alertReactionSchema = z.object({
  type: z.enum(["LIKE", "DISLIKE"]),
  alertId: z.string(),
});

export class AlertReactionDto extends createZodDto(alertReactionSchema) {}
