import { z } from 'zod'

export const signInSchema = z.object({
  cpf: z.string().min(1),
  password: z.string().min(1),
})

export type SignInBody = z.infer<typeof signInSchema>
