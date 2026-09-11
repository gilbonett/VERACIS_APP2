import z from "zod";

export const resetSchema = z
  .object({
    token: z.string(),
    newPassword: z
      .string()
      .min(8, "A senha deve ter no mínimo 8 caracteres")
      .regex(/[a-z]/, "A senha deve conter pelo menos uma letra minúscula")
      .regex(/[A-Z]/, "A senha deve conter pelo menos uma letra maiúscula")
      .regex(/\d/, "A senha deve conter pelo menos um número")
      .regex(
        /[!@#%$&*()_+\-=[\]{};':"\\|,.<>/?]/,
        "A senha deve conter pelo menos um símbolo especial",
      ),
    confirmPassword: z.string().min(8, "No minimo 8 caracteres"),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
