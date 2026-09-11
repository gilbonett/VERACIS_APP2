import { cookies } from 'next/headers'
import 'server-only'

export async function handleUnauthorized() {
  const cookiesStore = await cookies()

  console.log(cookiesStore.getAll())

  // cookiesStore.delete(COOKIE_NAMES.AUTH_TOKEN);
}
