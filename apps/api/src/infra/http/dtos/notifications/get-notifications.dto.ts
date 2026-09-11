import { createZodDto } from "nestjs-zod";
import z from "zod";

export class GetNotificationsQueryDto extends createZodDto(
  z.object({
    cursor: z.string().optional(),
    limit: z.coerce.number().optional().default(10),
  }),
) {}
