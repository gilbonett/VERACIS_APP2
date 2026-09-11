import { extractCookies } from "@/lib/extract-cookies";
import { env } from "@/public-env";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAMES } from "../cookies/options";
import { getCookiesFromHeaders } from "../utils/get-cookies-from-headers";

interface ConfirmCodeUserRequest {
  code: string;
}

export async function confirmCodeUser(data: ConfirmCodeUserRequest) {
  const incomingHeaders = await headers();
  const url = new URL("session/otp/verify", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: getCookiesFromHeaders(incomingHeaders),
  });

  if (!response.ok) {
    const text = await response.text();
    const error = JSON.parse(text) as { message: string };

    throw new Error(error.message);
  }

  const setCookieHeader = response.headers.get("set-cookie");

  if (setCookieHeader) {
    const cookieStore = await cookies();
    const extractedCookies = extractCookies(setCookieHeader);

    extractedCookies.map((cookie) =>
      cookieStore.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
        path: cookie.path,
        domain: cookie.domain,
      }),
    );

    cookieStore.delete({
      name: COOKIE_NAMES.CHAGELLE_TOKEN,
      domain: env.COOKIE_DOMAIN,
    });
  }

  redirect("/map");
}
