import { z } from 'zod'

export const completeFederatedLoginSchema = z.object({
  code: z.string().min(1),
  state: z.string().min(1),
})

export type CompleteFederatedLoginQuery = z.infer<
  typeof completeFederatedLoginSchema
>
