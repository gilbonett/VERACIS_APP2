import { createZodDto } from "nestjs-zod";
import z from "zod";

export class ValidateResetTokenDto extends createZodDto(
  z.object({ token: z.string() }),
) {}
