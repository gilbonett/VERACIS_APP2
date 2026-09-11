import "server-only";

import { env } from "@/public-env";
import { headers } from "next/headers";
import z from "zod";
import { getCookiesFromHeaders } from "../utils/get-cookies-from-headers";

interface SendOtpUserRequest {
  email: string;
}

const StepConfirmEmailSchema = z.object({
  expiresAt: z.string(),
});

export async function sendOtpUser(data: SendOtpUserRequest) {
  const incomingHeaders = await headers();
  const url = new URL("session/otp/send", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: getCookiesFromHeaders(incomingHeaders),
  });

  if (!response.ok) {
    throw new Error("Falha na confirmação");
  }

  const result = await response.json();

  return StepConfirmEmailSchema.parse(result);
}
