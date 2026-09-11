import { env } from "@/public-env";
import { updateTag } from "next/cache";
import { headers } from "next/headers";
import "server-only";
import z from "zod";
import { getCookiesForUpload } from "../utils/get-cookies-for-upload";
import { updateUser } from "./update-user";
// import { getCookiesForUpload } from './utils/get-cookies-for-upload'

type UploadAvatarProps = {
  file: File;
};

const UploadSchema = z.object({
  attachmentId: z.string(),
  url: z.string(),
});

export async function uploadAvatar({ file }: UploadAvatarProps) {
  const formData = new FormData();
  formData.append("file", file);

  const url = new URL("attachments", env.API_URL);

  url.searchParams.append("scope", "USER");
  url.searchParams.append("path", "users");

  const incomingHeaders = await headers();

  const response = await fetch(url, {
    method: "POST",
    body: formData,
    headers: getCookiesForUpload(incomingHeaders),
  });

  if (!response.ok) {
    throw new Error("Falha ao atualizar foto de perfil");
  }

  const body = await response.json();
  const result = UploadSchema.parse(body);

  await updateUser({ avatarUrl: result.url });

  updateTag("upload-avatar");
}
