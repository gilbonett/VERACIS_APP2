import { createZodDto } from "nestjs-zod";
import z from "zod";

export class CategoryIdParamsDto extends createZodDto(
  z.object({
    categoryId: z.uuid("Informe um ID de categoria válido"),
  }),
) {}
