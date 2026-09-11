import { CookiesFn, setCookie as setCookieNext } from "cookies-next";
import { CookieOptions } from "./options";

export async function setCookie(
  name: string,
  value: string,
  options: CookieOptions = {},
) {
  let cookieStore: CookiesFn | undefined;

  if (typeof window === "undefined") {
    const { cookies: serverCookies } = await import("next/headers");

    cookieStore = serverCookies;
  }

  await setCookieNext(name, value, { cookies: cookieStore, ...options });
}
