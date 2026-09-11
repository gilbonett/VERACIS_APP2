import { env } from "@/public-env";
import { headers } from "next/headers";
import { getCookiesFromHeaders } from "../utils/get-cookies-from-headers";

interface updateUserRequest {
  avatarUrl?: string | null;
}

export async function updateUser(data: updateUserRequest) {
  const incomingHeaders = await headers();
  const url = new URL("users", env.API_URL);

  const response = await fetch(url, {
    method: "PATCH",
    body: JSON.stringify(data),
    headers: getCookiesFromHeaders(incomingHeaders),
  });

  if (!response.ok) {
    throw new Error("falha ao atualizar usuário");
  }
}
