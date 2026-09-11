import z from 'zod'

export const loginSchema = z.object({
  cpf: z
    .string()
    .min(1, 'Informe um CPF válido')
    .transform((val) => val.replace(/\D/g, '')),
  password: z.string().min(8, 'Informe uma senha com pelo menos 8 caracteres'),
})
