import z from 'zod'

export const notificationSchema = z.object({
  eventId: z
    .string('Selecione uma notificação.')
    .min(1, { message: 'Selecione uma notificação.' }),
  description: z
    .string('Descrição e obrigatório.')
    .min(1, { message: 'Descrição obrigatória.' }),
  lat: z.number(),
  lng: z.number(),
})
