
import { env } from "@/public-env";
import { Either, left, right } from "./utils/either";

type UpdatePasswordRequest = {
  token: string;
  newPassword: string;
};

type UpdatePasswordResponse = Either<Error, null>;

export async function updatePassword(
  data: UpdatePasswordRequest,
): Promise<UpdatePasswordResponse> {
  const url = new URL("auth/reset-password", env.API_URL);

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

  return right(null);
}
