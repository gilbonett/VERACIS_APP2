import { env } from "@/public-env";
import "server-only";
import { Either, left, right } from "./utils/either";

type LoginUserAuthenticateRequest = {
  cpf: string;
  password: string;
};

type LoginUserAuthenticateResponse = Either<
  Error,
  {
    token: string;
  }
>;

export async function loginUserAuthenticate(
  data: LoginUserAuthenticateRequest,
): Promise<LoginUserAuthenticateResponse> {
  const url = new URL("auth/login", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    body: JSON.stringify(data),
    headers: {
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const error = (await response.json()) as Error;

    return left(new Error(error.message));
  }

  const { token } = (await response.json()) as { token: string };

  return right({
    token,
  });
}
