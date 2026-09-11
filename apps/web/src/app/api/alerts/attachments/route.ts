import { forwardJsonWithSessionToApi } from "@/http/session-aware-api-proxy";
import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";

const CONNECT_ERROR =
  "Não foi possível conectar ao servidor da API. Confira se ela está rodando e se NEXT_PUBLIC_API_URL está correto.";

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
      apiPathForLog: "api/alerts/attachments POST",
      buildApiUrl: () => new URL("alerts/attachments", env.API_URL),
      method: "POST",
      body: JSON.stringify(body),
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/alerts/attachments POST]", error);
    return NextResponse.json(
      { message: "Erro interno ao vincular anexo ao alerta." },
      { status: 500 },
    );
  }
}
