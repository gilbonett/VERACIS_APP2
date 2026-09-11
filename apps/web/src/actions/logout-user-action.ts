"use server";

import { logoutUser } from "@/http/mutations/logout-user";
import { protectedActionClient } from "@/lib/action-client";

export const logoutUserAction = protectedActionClient.action(async () => {
  return logoutUser();
});
