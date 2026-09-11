import { env } from "@/public-env";

interface RegisterUserRequest {
  name: string;
  cpf: string;
  birthDate: string;
  // role: "MEMBER" | "LEADER";
  role: string;
  lastedLat: number;
  lastedLng: number;
  phone: string;
  email: string;
  password: string;
  termsId: string;
  communityIds: string[];
}

export async function registerUser(data: RegisterUserRequest) {
  const url = new URL("users", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const defaultMessage = "Falha ao criar usuário.";

    if (response.status === 400) {
      const errorData = await response.json();
      throw new Error(errorData.message || defaultMessage);
    }

    throw new Error(defaultMessage);
  }

  return response.json();
}
