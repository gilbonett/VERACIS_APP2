import "server-only";

import { env } from "@/public-env";
import { updateTag } from "next/cache";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { COOKIE_NAMES } from "../cookies/options";
import { PROFILE_TAGS } from "../queries/get-profile";
import { getCookiesFromHeaders } from "../utils/get-cookies-from-headers";

export async function logoutUser() {
  const incomingHeaders = await headers();
  const cookieStore = await cookies();
  const url = new URL("session/logout", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    headers: getCookiesFromHeaders(incomingHeaders),
  });

  if (!response.ok) {
    if (response.status === 400) {
      throw new Error("Falha ao sair da plataforma");
    }

    throw new Error("Aconteceu um erro inesperado");
  }

  cookieStore.delete({
    name: COOKIE_NAMES.SESSION_TOKEN,
    domain: env.COOKIE_DOMAIN,
  });

  updateTag(PROFILE_TAGS.LOGOUT);
  redirect("/map");
}
