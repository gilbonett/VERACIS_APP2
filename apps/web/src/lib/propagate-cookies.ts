import { setCookie } from "@/http/cookies/set-cookie";
import { extractCookies } from "./extract-cookies";

/**
 * Lê o Set-Cookie de uma Response e propaga os cookies
 * para o browser via cookies() do Next.js.
 *
 * Usar em Server Actions após chamadas autenticadas.
 */
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
        path: cookie.path,
      }),
    ),
  );
}
