"use server";

import { notificationSchema } from "@/app/(app)/map/notification.schema";
import { registerNotification } from "@/http/register-notification";
import { protectedActionClient } from "@/lib/action-client";
import { updateTag } from "next/cache";

export const registerNotificationAction = protectedActionClient
  .inputSchema(notificationSchema)
  .action(async ({ parsedInput: input, ctx }) => {
    const result = await registerNotification({
      ...input,
      communityId: ctx.user.communities[0].communityId,
    });

    if (result.isLeft()) {
      throw new Error(result.value.message);
    }

    console.log("Notification registered successfully");
    updateTag("create-notification");
    console.log("update tag");

    return result.value;
  });
