import { extractCookies } from "@/lib/extract-cookies";
import { env } from "@/public-env";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

interface SignInUserRequest {
  cpf: string;
  password: string;
}

// const SignInUserResponseSchema = z.discriminatedUnion("step", [
//   z.object({ step: z.literal("PENDING_EMAIL"), emailMasked: z.string() }),
//   z.object({ step: z.literal("DONE") }),
// ]);

export async function signInUser(data: SignInUserRequest) {
  const url = new URL("session/sign-in", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const text = await response.text();
    const error = JSON.parse(text) as { message: string };

    throw new Error(error.message);
  }

  const setCookieHeader = response.headers.get("set-cookie");

  if (setCookieHeader) {
    const cookieStore = await cookies();
    const extractedCookies = extractCookies(setCookieHeader);

    extractedCookies.map((cookie) =>
      cookieStore.set(cookie.name, cookie.value, {
        httpOnly: cookie.httpOnly,
        secure: cookie.secure,
        sameSite: cookie.sameSite,
        expires: cookie.expires,
        maxAge: cookie.maxAge,
        path: cookie.path,
        domain: cookie.domain,
      }),
    );
  }

  const result = await response.json();

  if (result.step === "PENDING_EMAIL") {
    redirect(`/auth/${result.emailMasked}`);
  }

  redirect("/map");
}
