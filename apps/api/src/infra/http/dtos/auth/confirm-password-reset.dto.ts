import { createZodDto } from "nestjs-zod";
import z from "zod";

export class ConfirmPasswordResetDto extends createZodDto(
  z.object({
    token: z.string(),
    newPassword: z.string().min(8),
  }),
) {}
