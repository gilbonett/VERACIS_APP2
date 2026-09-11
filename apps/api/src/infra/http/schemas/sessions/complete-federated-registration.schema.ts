import { z } from 'zod'

export const completeFederatedRegistrationSchema = z.object({
  name: z
    .string()
    .min(1)
    .transform((value) =>
      value
        .trim()
        .toLowerCase()
        .replace(/\b\w/g, (char) => char.toUpperCase()),
    ),
  cpf: z.string().transform((value) => value.replace(/\D/g, '')),
  email: z.string().transform((value) => value.toLowerCase()),
  phone: z.string().transform((value) => value.replace(/\D/g, '')),
  birthDate: z
    .string()
    .regex(/^\d{2}\/\d{2}\/\d{4}$/, 'Formato inválido. Use DD/MM/YYYY')
    .transform((value) => {
      const [day, month, year] = value.split('/')
      return `${year}-${month}-${day}`
    }),
  latitude: z.number(),
  longitude: z.number(),
  communityId: z.uuid(),
})

export type CompleteFederatedRegistrationBody = z.infer<
  typeof completeFederatedRegistrationSchema
>
