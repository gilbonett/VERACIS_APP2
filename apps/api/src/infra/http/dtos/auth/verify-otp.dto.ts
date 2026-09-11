import { createZodDto } from "nestjs-zod";
import z from "zod";

export class VerifyOtpDto extends createZodDto(
  z.object({ code: z.string().length(6) }),
) {}
