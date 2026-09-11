import { cookies } from "next/headers";
import "server-only";

export async function removeCookie(name: string) {
  const cookieStore = await cookies();

  const sessionCookie = cookieStore.get(name);

  if (!sessionCookie) {
    throw new Error(`Cookie ${name} not found`);
  }

  cookieStore.delete(name);
}
