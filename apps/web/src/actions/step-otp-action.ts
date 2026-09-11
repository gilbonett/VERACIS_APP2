"use server";

import { stepOtpSchema } from "@/app/auth/[email]/step-schemas";
import { confirmCodeUser } from "@/http/mutations/confirm-code-user";
import { actionClient } from "@/lib/action-client";

export const stepOtpAction = actionClient
  .inputSchema(stepOtpSchema)
  .action(async ({ parsedInput: input }) => {
    console.log("action", input);
    return confirmCodeUser(input);
  });
