import { z } from 'zod'

export const confirmTwoFactorMethodSchema = z.object({
  code: z.string().min(1),
})

export type ConfirmTwoFactorMethodBody = z.infer<
  typeof confirmTwoFactorMethodSchema
>
