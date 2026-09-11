"use server";

import { uploadAvatar } from "@/http/mutations/upload-avatar";
import { protectedActionClient } from "@/lib/action-client";
import { zfd } from "zod-form-data";

export const uploadAvatarAction = protectedActionClient
  .inputSchema(
    zfd.formData({
      file: zfd.file(),
    }),
  )
  .action(async ({ parsedInput: input }) => {
    return uploadAvatar(input);
  });
