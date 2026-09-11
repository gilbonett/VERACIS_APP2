import { createZodDto } from "nestjs-zod";
import z from "zod";

export class UpdateProfileDto extends createZodDto(
  z.object({
    avatarUrl: z.url().nullish(),
  }),
) {}
