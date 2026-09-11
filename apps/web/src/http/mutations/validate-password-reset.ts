import { env } from "@/public-env";

interface ValidatePasswordResetRequest {
  token: string;
}

export async function validatePasswordReset(
  data: ValidatePasswordResetRequest,
) {
  const url = new URL("validate/password/reset", env.API_URL);

  const result = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!result.ok) {
    return { valid: false };
  }

  return { valid: true };
}
