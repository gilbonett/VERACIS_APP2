import z from "zod";

export const requestPasswordSchema = z.object({
  email: z.email("Informe um email válido."),
});

export type IRequestPasswordSchema = z.infer<typeof requestPasswordSchema>;
