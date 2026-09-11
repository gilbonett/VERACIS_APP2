"use server";

import { requestPasswordSchema } from "@/app/auth/request-password/request-password-schema";
import { requestPassword } from "@/http/mutations/request-password";
import { actionClient } from "@/lib/action-client";

export const requestPasswordAction = actionClient
  .inputSchema(requestPasswordSchema)
  .action(async ({ parsedInput }) => {
    return requestPassword(parsedInput);
  });
