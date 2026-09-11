import { forwardJsonWithSessionToApi } from "@/http/session-aware-api-proxy";
import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";

const CONNECT_ERROR =
  "Não foi possível conectar ao servidor da API. Confira se ela está rodando e se NEXT_PUBLIC_API_URL está correto.";

export async function GET(request: NextRequest) {
  try {
    const incoming = new URL(request.url);
    return await forwardJsonWithSessionToApi({
      request,
      apiPathForLog: "api/alerts GET",
      buildApiUrl: () => {
        const apiUrl = new URL("alerts", env.API_URL);
        incoming.searchParams.forEach((value, key) => {
          apiUrl.searchParams.append(key, value);
        });
        return apiUrl;
      },
      method: "GET",
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/alerts GET]", error);
    return NextResponse.json(
      { message: "Erro interno ao listar alertas." },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { message: "Corpo da requisição inválido." },
        { status: 400 },
      );
    }

    return await forwardJsonWithSessionToApi({
      request,
      apiPathForLog: "api/alerts POST",
      buildApiUrl: () => new URL("alerts", env.API_URL),
      method: "POST",
      body: JSON.stringify(body),
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/alerts POST]", error);
    return NextResponse.json(
      { message: "Erro interno ao criar alerta." },
      { status: 500 },
    );
  }
}
