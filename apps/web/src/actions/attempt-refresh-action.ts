"use server";

import { getCookiesFromHeaders } from "@/http/utils/get-cookies-from-headers";
import { propagateCookies } from "@/http/utils/propagate-cookies";
import { env } from "@/public-env";
import { headers } from "next/headers";

export async function attemptRefreshAction() {
  const incomingHeaders = await headers();

  const url = new URL("auth/refresh", env.API_URL);

  const response = await fetch(url.toString(), {
    method: "POST",
    headers: getCookiesFromHeaders(incomingHeaders),
  });

  await propagateCookies(response);

  return response;
}
