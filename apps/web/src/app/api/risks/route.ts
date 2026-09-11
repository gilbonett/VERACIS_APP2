import { forwardJsonWithSessionToApi } from "@/http/session-aware-api-proxy";
import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";

const CONNECT_ERROR =
  "Não foi possível conectar ao servidor da API. Confira se ela está rodando e se NEXT_PUBLIC_API_URL está correto.";

export async function GET(request: NextRequest) {
  try {
    return await forwardJsonWithSessionToApi({
      request,
      apiPathForLog: "api/risks GET",
      buildApiUrl: () => new URL("risks", env.API_URL),
      method: "GET",
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/risks GET]", error);
    return NextResponse.json(
      { message: "Erro interno ao listar riscos." },
      { status: 500 },
    );
  }
}
