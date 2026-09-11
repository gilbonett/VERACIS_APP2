import { createZodDto } from "nestjs-zod";
import z from "zod";

const latitude = z
  .number("Informe uma latitude válida")
  .min(-90, "Latitude deve ser no mínimo -90")
  .max(90, "Latitude deve ser no máximo 90");

const longitude = z
  .number("Informe uma longitude válida")
  .min(-180, "Longitude deve ser no mínimo -180")
  .max(180, "Longitude deve ser no máximo 180");

export class CreateAlertDto extends createZodDto(
  z.object({
    lat: latitude,
    lng: longitude,
    description: z.string().nullish(),
    categoryId: z.string("Informe um ID de categoria válido"),
    communityId: z.string("Informe um ID de comunidade válido"),
    eventIds: z.array(z.string("Informe um ID de evento válido")),
    riskIds: z.array(z.string("Informe um ID de risco válido")).default([]),
  }),
) {}
