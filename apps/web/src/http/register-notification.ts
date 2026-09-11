
import { env } from "@/public-env";
import { headers } from "next/headers";
import { Either, left, right } from "./utils/either";
import { getCookiesFromHeaders } from "./utils/get-cookies-from-headers";

type RegisterNotificationProps = {
  description: string;
  lat: number;
  lng: number;
  eventId: string;
  communityId: string;
};

type RegisterNotification = Either<
  Error,
  {
    message: string;
  }
>;

export async function registerNotification(
  data: RegisterNotificationProps,
): Promise<RegisterNotification> {
  const url = new URL("notifications", env.API_URL);

  const incomingHeaders = await headers();

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: getCookiesFromHeaders(incomingHeaders),
  });

  if (!response.ok) {
    const error = (await response.json()) as Error;

    return left(new Error(error.message));
  }

  return right({
    message: "Notificação cadastrada com sucesso!",
  });
}
