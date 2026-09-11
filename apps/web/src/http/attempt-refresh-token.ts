import "server-only";

import { env } from "@/public-env";
import { getCookiesFromHeaders } from "./utils/get-cookies-from-headers";

export async function attemptRefreshToken(headers: Headers) {
  const url = new URL("auth/refresh", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    headers: getCookiesFromHeaders(headers),
  });

  return response;
}
