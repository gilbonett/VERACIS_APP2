import z from 'zod'

export const healthNotificationSchema = z.object({
  symptomIds: z
    .array(z.string())
    .min(1, { message: 'Selecione ao menos um sintoma ou dor.' }),
})

export type HealthNotificationSchema = z.infer<typeof healthNotificationSchema>
