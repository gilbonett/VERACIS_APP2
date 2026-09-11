import { env } from '@/public-env'
import z from 'zod'

interface GetNotificationRequest {
  cursor?: string
}

export const notificationItemSchema = z.object({
  id: z.string(),
  scope: z.enum(['ALERT', 'USER']).optional(),
  title: z.string(),
  content: z.string(),
  readAt: z.string().nullish(),
  alertId: z.string().nullish(),
  createdAt: z.string(),
})

export const notificationItemsSchema = z.array(notificationItemSchema)

export const notificationSchema = z.object({
  count: z.number(),
  nextCursor: z.string().nullish(),
  items: notificationItemsSchema,
})

type GetNotificationResponse = z.infer<typeof notificationSchema>

export async function getNotifications({
  cursor,
}: GetNotificationRequest): Promise<GetNotificationResponse> {
  const url = new URL('notifications', env.API_URL)

  if (cursor) url.searchParams.set('cursor', cursor)

  const response = await fetch(url, {
    credentials: 'include',
  })

  const responseData = await response.json()

  return notificationSchema.parse(responseData)
}
