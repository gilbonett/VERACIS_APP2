import z from "zod";

export const stepEmailSchema = z.object({
  email: z.email("Digite um e-mail válido").min(1, "O e-mail é obrigatório"),
});

export const stepOtpSchema = z.object({
  code: z.string().transform((val) => val.replace(/\D/g, "")),
});
