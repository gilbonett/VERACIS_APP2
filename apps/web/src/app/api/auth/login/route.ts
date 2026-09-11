import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";
import z from "zod";

const schema = z.object({
  cpf: z.string(),
  password: z.string(),
});

export async function POST(request: NextRequest) {
  const body = await request.json();

  const parsed = schema.safeParse(body);

  if (!parsed.success) {
    return NextResponse.json(parsed.error, { status: 400 });
  }

  const url = new URL("auth/login", env.API_URL);

  const response = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(parsed.data),
  });

  if (!response.ok) {
    const text = await response.text();

    const error = JSON.parse(text) as { message: string; statusCode: number };

    return NextResponse.json(error, { status: error.statusCode });
  }

  const data = await response.json();

  return NextResponse.json(data, {
    status: response.status,
    headers: response.headers,
  });
}
