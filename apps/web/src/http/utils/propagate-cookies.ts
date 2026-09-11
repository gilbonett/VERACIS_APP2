import { extractCookies } from "@/utils/extract-cookie";
import { setCookie } from "../cookies/set-cookie";

export async function propagateCookies(response: Response): Promise<void> {
  const setCookieHeader = response.headers.get("set-cookie");
  if (!setCookieHeader) return;

  const extractedCookies = extractCookies(setCookieHeader);

  await Promise.all(
    extractedCookies.map((cookie) =>
      setCookie(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: true,
        sameSite: cookie.sameSite,
        maxAge: cookie.maxAge,
        expires: cookie.expires,
        path: cookie.path ?? "/",
      }),
    ),
  );
}
