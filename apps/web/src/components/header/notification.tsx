'use client'

import {
  dispatchOpenMapAlertDetail,
  stashPendingOpenMapAlertId,
} from '@/app/(app)/map/constants/open-map-alert-detail'
import { useUser } from '@/contexts/user-context'
import { formatRelativeDate } from '@/helpers/format'
import { useNotifications } from '@/http/hooks/use-notifications'
import { useReadNotification } from '@/http/hooks/use-read-notification'
import { Bell, Loader2 } from 'lucide-react'
import { usePathname, useRouter } from 'next/navigation'
import { useCallback, useRef, useState } from 'react'
import { Avatar, AvatarFallback } from '../avatar'
import { Popover, PopoverContent, PopoverTrigger } from '../popover'
import { ScrollArea } from '../scroll-area'

function truncate(text: string, max: number) {
  return text.length > max ? text.slice(0, max) + '...' : text
}

export function Notification() {
  const { user } = useUser()

  const router = useRouter()
  const pathname = usePathname()
  const [popoverOpen, setPopoverOpen] = useState(false)
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } =
    useNotifications(user !== null)
  const { mutateAsync: readNotification } = useReadNotification()
  const observerRef = useRef<IntersectionObserver | null>(null)

  const notifications = data?.pages.flatMap((p) => p.items) ?? []
  const count = data?.pages[0]?.count ?? 0

  const loaderRef = useCallback(
    (node: HTMLDivElement | null) => {
      observerRef.current?.disconnect()
      if (!node) return

      const viewport = node.closest(
        "[data-slot='scroll-area-viewport']",
      ) as HTMLElement | null

      observerRef.current = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting && hasNextPage) fetchNextPage()
        },
        { root: viewport, threshold: 0.1 },
      )
      observerRef.current.observe(node)
    },
    [hasNextPage, fetchNextPage],
  )

  async function handleNotificationClick(notification: {
    id: string
    scope?: 'ALERT' | 'USER'
    alertId?: string | null
    readAt?: string | null
  }) {
    if (!notification.readAt) {
      await readNotification(notification.id)
    }

    const alertId = notification.alertId
    if (
      typeof alertId !== 'string' ||
      alertId.length === 0 ||
      notification.scope === 'USER'
    ) {
      return
    }

    setPopoverOpen(false)

    if (pathname !== '/map') {
      stashPendingOpenMapAlertId(alertId)
      router.push('/map')
      return
    }

    dispatchOpenMapAlertDetail({ alertId })
  }

  return (
    user && (
      <Popover open={popoverOpen} onOpenChange={setPopoverOpen}>
        <PopoverTrigger
          render={
            <button
              type="button"
              className="relative p-2 rounded-full hover:bg-accent transition-colors"
            >
              <Bell className="size-6 text-foreground" />
              {count > 0 && (
                <span className="absolute -top-0.5 -right-0.5 min-w-4.5 h-4.5 px-1 rounded-full bg-green-500 text-white text-[10px] font-semibold flex items-center justify-center leading-none">
                  {count > 99 ? '99+' : count}
                </span>
              )}
            </button>
          }
        />

        <PopoverContent
          align="end"
          sideOffset={8}
          className="w-full right-1 md:w-90 p-0 rounded-sm shadow-lg border overflow-hidden"
        >
          {/* header */}
          <div className="px-5 py-4 border-b border-border">
            <h2 className="text-base font-semibold text-foreground">
              Notificações
            </h2>
          </div>

          {/* lista */}
          <ScrollArea className="h-100">
            {notifications.length === 0 && !isFetchingNextPage ? (
              <div className="flex flex-col items-center justify-center h-85 gap-4 select-none">
                {/* ilustração sino triste */}
                <div className="relative flex items-center justify-center w-40 h-40">
                  {/* círculo de fundo */}
                  <div className="absolute w-32 h-32 rounded-full bg-muted/60" />

                  {/* bolinhas decorativas */}
                  <span className="absolute top-2 left-4 w-2 h-2 rounded-full bg-muted-foreground/20" />
                  <span className="absolute top-6 right-3 w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                  <span className="absolute bottom-4 left-2 w-1.5 h-1.5 rounded-full bg-muted-foreground/20" />
                  <span className="absolute bottom-6 right-4 w-2 h-2 rounded-full bg-muted-foreground/20" />

                  {/* cruzes decorativas */}
                  <svg
                    className="absolute top-1 right-8 w-3 h-3 text-muted-foreground/30"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M6 0v12M0 6h12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>
                  <svg
                    className="absolute bottom-2 left-8 w-3 h-3 text-muted-foreground/30"
                    viewBox="0 0 12 12"
                    fill="none"
                  >
                    <path
                      d="M6 0v12M0 6h12"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                    />
                  </svg>

                  {/* sino SVG */}
                  <svg
                    className="relative w-20 h-20 text-muted-foreground/30"
                    viewBox="0 0 80 80"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    {/* corpo do sino */}
                    <path
                      d="M40 8C40 8 20 18 20 42v10h40V42C60 18 40 8 40 8Z"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                    {/* base */}
                    <path
                      d="M16 52h48"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* badalo */}
                    <path
                      d="M34 52c0 3.314 2.686 6 6 6s6-2.686 6-6"
                      stroke="currentColor"
                      strokeWidth="3"
                      strokeLinecap="round"
                    />
                    {/* rosto triste */}
                    <circle cx="33" cy="38" r="2" fill="currentColor" />
                    <circle cx="47" cy="38" r="2" fill="currentColor" />
                    <path
                      d="M33 46c2-2 12-2 14 0"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                    {/* balão de fala */}
                    <rect
                      x="50"
                      y="18"
                      width="20"
                      height="14"
                      rx="4"
                      stroke="currentColor"
                      strokeWidth="2"
                    />
                    <circle cx="56" cy="25" r="1.5" fill="currentColor" />
                    <circle cx="61" cy="25" r="1.5" fill="currentColor" />
                    <circle cx="66" cy="25" r="1.5" fill="currentColor" />
                    <path
                      d="M54 32l-2 4"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>

                <p className="text-sm font-medium text-muted-foreground/60 tracking-wide">
                  Sem Notificações
                </p>
              </div>
            ) : (
              <ul>
                {notifications.map((notification) => (
                  <li
                    key={notification.id}
                    className="flex items-start gap-3 px-5 py-4 border-b border-border last:border-0 hover:bg-accent/50 transition-colors cursor-pointer"
                    onClick={() => {
                      void handleNotificationClick(notification)
                    }}
                  >
                    <Avatar className="shrink-0 mt-0.5 w-9 h-9">
                      <AvatarFallback className="text-xs font-medium">
                        AN
                      </AvatarFallback>
                    </Avatar>

                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground leading-snug">
                        {notification.title}
                      </p>
                      <p className="text-sm text-muted-foreground leading-snug mt-0.5">
                        {truncate(notification.content, 80)}
                      </p>
                      <span className="text-xs text-muted-foreground mt-1 block">
                        {formatRelativeDate(notification.createdAt)}
                      </span>
                    </div>

                    {!notification.readAt && (
                      <span className="shrink-0 mt-1.5 w-2 h-2 rounded-full bg-primary" />
                    )}
                  </li>
                ))}
              </ul>
            )}

            <div ref={loaderRef} className="py-4 flex justify-center">
              {isFetchingNextPage && (
                <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
              )}

              {!hasNextPage && notifications.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  Sem mais notificações
                </p>
              )}
            </div>
          </ScrollArea>
        </PopoverContent>
      </Popover>
    )
  )
}
