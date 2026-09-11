import { createZodDto } from "nestjs-zod";
import z from "zod";

export class GetCommunitiesQueryDto extends createZodDto(
  z.object({
    biomeId: z.uuid().optional(),
  }),
) {}
