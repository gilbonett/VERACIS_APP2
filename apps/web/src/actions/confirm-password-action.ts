"use server";

import { resetSchema } from "@/app/auth/request-password/reset/reset-schema";
import { confirmPassword } from "@/http/mutations/confirm-password";
import { actionClient } from "@/lib/action-client";

export const confirmPasswordAction = actionClient
  .inputSchema(resetSchema)
  .action(async ({ parsedInput: input }) => {
    return confirmPassword(input);
  });
