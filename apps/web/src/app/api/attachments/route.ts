import { forwardMultipartPostWithSessionToApi } from "@/http/session-aware-api-proxy";
import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";

const CONNECT_ERROR =
  "Não foi possível conectar ao servidor da API. Confira se ela está rodando e se NEXT_PUBLIC_API_URL está correto.";

export async function POST(request: NextRequest) {
  try {
    const incoming = new URL(request.url);
    return await forwardMultipartPostWithSessionToApi({
      request,
      apiPathForLog: "api/attachments POST",
      buildApiUrl: () => {
        const api = new URL("attachments", env.API_URL);
        incoming.searchParams.forEach((value, key) => {
          api.searchParams.set(key, value);
        });
        return api;
      },
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/attachments POST]", error);
    return NextResponse.json(
      { message: "Erro interno ao enviar arquivo." },
      { status: 500 },
    );
  }
}
