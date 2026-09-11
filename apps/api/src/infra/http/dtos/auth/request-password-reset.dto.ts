import { createZodDto } from "nestjs-zod";
import z from "zod";

export class RequestPasswordResetDto extends createZodDto(
  z.object({ email: z.email() }),
) {}
