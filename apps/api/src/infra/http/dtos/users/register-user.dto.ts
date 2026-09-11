import { createZodDto } from "nestjs-zod";
import z from "zod";

export class RegisterUserDto extends createZodDto(
  z.object({
    name: z.string().transform((value) =>
      value
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    ),
    cpf: z.string().transform((value) => value.replace(/\D/g, "")),
    birthDate: z
      .string()
      .regex(/^\d{2}\/\d{2}\/\d{4}$/, "Formato inválido. Use DD/MM/YYYY")
      .transform((value) => {
        const [day, month, year] = value.split("/");
        return new Date(`${year}-${month}-${day}`);
      }),
    role: z.enum(["MEMBER", "LEADER", "MANAGER", "ROOT"]).default("MEMBER"),
    lastedLat: z.number(),
    lastedLng: z.number(),
    phone: z.string().transform((value) => value.replace(/\D/g, "")),
    email: z.string().transform((value) => value.toLowerCase()),
    password: z.string(),
    termsId: z.uuid(),
    communityIds: z.array(z.uuid()),
  }),
) {}
