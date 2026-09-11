import { isAgeValid, isCpfValid } from "@/helpers/refines";
import z from "zod";

export const registerSchema = z
  .object({
    name: z
      .string()
      .transform((v) => v.trim().replace(/\s+/g, " "))
      .refine((v) => v.length > 0, {
        message: "O nome completo é obrigatório",
      }),
    terms: z
      .boolean("É necessário aceitar os termos e condições")
      .refine((v) => v === true, {
        message: "É necessário aceitar os termos e condições",
      }),
    cpf: z
      .string()
      .length(14, "O CPF deve conter 11 digitos")
      .refine(isCpfValid, "O CPF informado e invalido!"),
    birthDate: z
      .string()
      .min(1, "A data de nascimento é obrigatória")
      .refine(
        (date) => date.replace(/\D/g, "").length === 8,
        "Data de nascimento inválida",
      )
      .refine(isAgeValid, "Voce deve ter pelo menos 18 anos!"),
    communityId: z
      .string("A comunidade e obrigatoria")
      .min(1, "A comunidade e obrigatoria"),
    phone: z.string().min(1, "O telefone e obrigatorio"),
    email: z.email("O email e obrigatorio"),
    role: z.string().min(1, "O papel e obrigatorio"),
    lastedLat: z.number(),
    lastedLng: z.number(),
    password: z
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
  .refine((data) => data.password === data.confirmPassword, {
    message: "As senhas não coincidem",
    path: ["confirmPassword"],
  });
