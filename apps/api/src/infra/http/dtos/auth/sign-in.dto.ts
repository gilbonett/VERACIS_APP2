import { createZodDto } from "nestjs-zod";
import z from "zod";

export class SignInDto extends createZodDto(
  z.object({
    cpf: z.string(),
    password: z.string().min(1),
  }),
) {}
