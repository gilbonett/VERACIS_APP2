import { env } from "@/public-env";

export async function readNotification(notificationId: string) {
  const url = new URL(`notifications/${notificationId}/read`, env.API_URL);

  await fetch(url, {
    method: "PATCH",
    credentials: "include",
  });
}
