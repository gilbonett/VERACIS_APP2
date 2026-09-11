import { getProfile } from "@/http/queries/get-profile";
import {
  createSafeActionClient,
  DEFAULT_SERVER_ERROR_MESSAGE,
} from "next-safe-action";

export const actionClient = createSafeActionClient({
  handleServerError(error) {
    if (error instanceof Error) {
      return error.message;
    }

    return DEFAULT_SERVER_ERROR_MESSAGE;
  },
});

export const protectedActionClient = actionClient.use(async ({ next }) => {
  const user = await getProfile();

  if (!user) {
    throw new Error("Não autorizado.");
  }

  return next({ ctx: { user: user } });
});
