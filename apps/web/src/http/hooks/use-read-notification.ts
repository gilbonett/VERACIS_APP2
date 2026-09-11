import { readNotification } from "@/http/mutations/read-notification";
import {
  type InfiniteData,
  useMutation,
  useQueryClient,
} from "@tanstack/react-query";
import type { z } from "zod";
import type { notificationSchema } from "../queries/get-notifications";
import { NOTIFICATIONS_QUERY_KEY } from "./use-notifications";

type NotificationPage = z.infer<typeof notificationSchema>;

export function useReadNotification() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: readNotification,
    async onMutate(notificationId: string) {
      await queryClient.cancelQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });

      const previous = queryClient.getQueryData<InfiniteData<NotificationPage>>(
        NOTIFICATIONS_QUERY_KEY,
      );

      queryClient.setQueryData<InfiniteData<NotificationPage>>(
        NOTIFICATIONS_QUERY_KEY,
        (data) => {
          if (!data) return data;

          return {
            ...data,
            pages: data.pages.map((page) => {
              const notification = page.items.find(
                (item) => item.id === notificationId,
              );

              if (!notification || notification.readAt) return page;

              return {
                ...page,
                count: Math.max(page.count - 1, 0),
                items: page.items.map((item) =>
                  item.id === notificationId
                    ? { ...item, readAt: new Date().toISOString() }
                    : item,
                ),
              };
            }),
          };
        },
      );

      return { previous };
    },
    onError(_error, _notificationId, context) {
      if (context?.previous) {
        queryClient.setQueryData(NOTIFICATIONS_QUERY_KEY, context.previous);
      }
    },
    onSettled() {
      queryClient.invalidateQueries({ queryKey: NOTIFICATIONS_QUERY_KEY });
    },
  });
}
