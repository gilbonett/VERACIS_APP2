"use server";

import { registerSchema } from "@/app/auth/register/register-schema";
import { registerUser } from "@/http/mutations/register-user";
import { actionClient } from "@/lib/action-client";

export const registerUserAction = actionClient
  .inputSchema(registerSchema)
  .action(async ({ parsedInput: input }) => {
    const data = {
      ...input,
      termsId: "895994ec-28d5-4e95-b136-bc6278ca3b70",
      communityIds: [input.communityId],
    };
    return registerUser(data);
  });
