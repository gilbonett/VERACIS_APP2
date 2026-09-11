import { hasCookie } from "@/http/cookies/has-cookie";
import { COOKIE_NAMES } from "@/http/cookies/options";

export async function hasAuthenticated(): Promise<boolean> {
  return hasCookie(COOKIE_NAMES.SESSION_TOKEN);
}
