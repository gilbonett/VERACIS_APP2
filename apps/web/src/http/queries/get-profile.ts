import "server-only";

import { hasAuthenticated } from "@/auth/has-authenticated";
import { env } from "@/public-env";
import { USER_ROLES } from "@/utils/user-roles";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { COOKIE_NAMES } from "../cookies/options";
import { getCookiesFromHeaders } from "../utils/get-cookies-from-headers";
import { parseTagsFromFetch } from "../utils/parse-tags-from-fetch";

const UserSchema = z.object({
  id: z.string(),
  role: z.enum(USER_ROLES),
  name: z.string(),
  email: z.email(),
  cpf: z.string(),
  lastedLat: z.number(),
  lastedLng: z.number(),
  phone: z.string().nullable().optional(),
  avatarUrl: z.string().nullish(),
  mapTutorialCompletedAt: z.string().nullable().optional(),
  birthDate: z.string().transform((val) => {
    return new Date(val).toLocaleDateString("pt-BR");
  }),
  communities: z.array(
    z.object({
      communityId: z.string(),
      communityName: z.string(),
      biomeName: z.string(),
    }),
  ),
});

export type GetProfileResponse = z.infer<typeof UserSchema>;

export const PROFILE_TAGS = {
  LOGOUT: "logout-profile-action",
  PROFILE: "profile",
} as const;

export async function getProfile() {
  const isAuth = await hasAuthenticated();

  if (!isAuth) {
    return null;
  }

  const incomingHeaders = await headers();
  const url = new URL("users/me", env.API_URL);

  const response = await fetch(url, {
    headers: getCookiesFromHeaders(incomingHeaders),
    cache: "no-store",
    next: {
      tags: parseTagsFromFetch(PROFILE_TAGS),
    },
  });

  if (response.status === 401) {
    const cookieStore = await cookies();
    cookieStore.delete({
      name: COOKIE_NAMES.SESSION_TOKEN,
      domain: env.COOKIE_DOMAIN,
    });
    redirect("/map");
  }

  if (!response.ok) {
    console.error(
      "[getProfile] API respondeu com erro",
      response.status,
      await response.text().catch(() => ""),
    );
    throw new Error("Failed to fetch profile");
  }

  const data = await response.json();
  const parsed = UserSchema.safeParse(data);

  if (!parsed.success) {
    console.error("[getProfile] Resposta inválida", parsed.error.flatten());
    throw new Error("Invalid profile response");
  }

  return parsed.data;
}
