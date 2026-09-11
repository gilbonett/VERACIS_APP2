import { useEventSource } from '@/hooks/use-event-source'
import { env } from '@/public-env'
import {
  type InfiniteData,
  useInfiniteQuery,
  useQueryClient,
} from '@tanstack/react-query'
import { useEffect, useRef } from 'react'
import type { z } from 'zod'
import {
  getNotifications,
  notificationItemSchema,
  type notificationSchema,
} from '../queries/get-notifications'

export const NOTIFICATIONS_QUERY_KEY = ['notifications']

type NotificationPage = z.infer<typeof notificationSchema>

export function useNotifications(enabled = true) {
  const queryClient = useQueryClient()

  const { data: event, status } = useEventSource(
    `${env.API_URL}/notifications/stream`,
    'notifications',
    enabled,
  )

  const result = useInfiniteQuery({
    queryKey: NOTIFICATIONS_QUERY_KEY,
    queryFn: ({ pageParam }) => getNotifications({ cursor: pageParam }),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
    refetchIntervalInBackground: false,
    enabled,
  })

  useEffect(() => {
    if (event === undefined) return

    const incoming = notificationItemSchema.parse(event)

    queryClient.setQueryData<InfiniteData<NotificationPage>>(
      NOTIFICATIONS_QUERY_KEY,
      (previous) => {
        if (!previous) return previous

        const alreadyKnown = previous.pages.some((page) =>
          page.items.some((item) => item.id === incoming.id),
        )

        if (alreadyKnown) return previous

        const [firstPage, ...restPages] = previous.pages

        return {
          ...previous,
          pages: [
            {
              ...firstPage,
              count: firstPage.count + 1,
              items: [incoming, ...firstPage.items],
            },
            ...restPages,
          ],
        }
      },
    )
  }, [event, queryClient])

  const previousStatusRef = useRef(status)

  useEffect(() => {
    if (previousStatusRef.current === 'reconnecting' && status === 'open') {
      queryClient.refetchQueries({ queryKey: NOTIFICATIONS_QUERY_KEY })
    }

    previousStatusRef.current = status
  }, [status, queryClient])

  return result
}
