import { env } from "@/public-env";

interface RequestPasswordReset {
  email: string;
}

export async function requestPassword({ email }: RequestPasswordReset) {
  const url = new URL("request/password/reset", env.API_URL);

  await fetch(url, {
    method: "POST",
    body: JSON.stringify({ email }),
    headers: {
      "Content-Type": "application/json",
    },
  });
}
