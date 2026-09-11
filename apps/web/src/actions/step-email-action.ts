"use server";

import { stepEmailSchema } from "@/app/auth/[email]/step-schemas";
import { sendOtpUser } from "@/http/mutations/send-otp-user";
import { actionClient } from "@/lib/action-client";

export const stepEmailAction = actionClient
  .inputSchema(stepEmailSchema)
  .action(async ({ parsedInput: input }) => {
    return sendOtpUser(input);
  });
