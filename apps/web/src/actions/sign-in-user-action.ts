"use server";

import { loginSchema } from "@/app/auth/signin/login-schema";
import { signInUser } from "@/http/mutations/sign-in-user";
import { actionClient } from "@/lib/action-client";

export const signInUserAction = actionClient
  .inputSchema(loginSchema)
  .action(async ({ parsedInput: input }) => {
    return signInUser(input);
  });
