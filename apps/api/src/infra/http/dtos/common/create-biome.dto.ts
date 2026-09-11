import { createZodDto } from "nestjs-zod";
import z from "zod";

export class CreateBiomeDto extends createZodDto(
  z.object({
    name: z.string(),
    description: z.string().nullish(),
  }),
) {}
