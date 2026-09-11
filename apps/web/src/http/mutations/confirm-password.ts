import { env } from "@/public-env";

interface ConfirmPasswordRequest {
  token: string;
  newPassword: string;
}

export async function confirmPassword(data: ConfirmPasswordRequest) {
  const url = new URL("confirm/password/reset", env.API_URL);

  const result = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!result.ok) {
    const defaultMessage = "Falha ao confirmar a redefinição de senha";

    if (result.status === 400) {
      const errorData = await result.json();
      throw new Error(errorData.message || defaultMessage);
    }

    throw new Error(defaultMessage);
  }
}
