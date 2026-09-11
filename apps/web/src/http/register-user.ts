
import { env } from "@/public-env";
import { Either, left, right } from "./utils/either";

type RegisterUserRequest = {
  name: string;
  role: string;
  cpf: string;
  birthDate: string;
  phone: string;
  email: string;
  emailRecovery?: string | null;
  password: string;
  communityIds: string[];
};

type RegisterUserResponse = Either<
  Error,
  {
    name: string;
  }
>;

export async function registerUser(
  data: RegisterUserRequest,
): Promise<RegisterUserResponse> {
  const url = new URL("users/register", env.API_URL);

  // console.log(data);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  const body = await response.json();

  if (!response.ok) {
    console.log(body);
    return left(new Error(body.message));
  }

  return right({
    name: body.data.name,
  });
}
