import { forwardJsonWithSessionToApi } from "@/http/session-aware-api-proxy";
import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";

const CONNECT_ERROR =
  "Não foi possível conectar ao servidor da API. Confira se ela está rodando e se NEXT_PUBLIC_API_URL está correto.";

type RouteContext = {
  params: Promise<{ alertId: string }>;
};

export async function GET(request: NextRequest, { params }: RouteContext) {
  try {
    const { alertId } = await params;
    return await forwardJsonWithSessionToApi({
      request,
      apiPathForLog: "api/alerts/:id GET",
      buildApiUrl: () => new URL(`alerts/${alertId}`, env.API_URL),
      method: "GET",
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/alerts/:id GET]", error);
    return NextResponse.json(
      { message: "Erro interno ao obter alerta." },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest, { params }: RouteContext) {
  try {
    const { alertId } = await params;
    const raw = await request.text();
    return await forwardJsonWithSessionToApi({
      request,
      apiPathForLog: "api/alerts/:id PATCH",
      buildApiUrl: () => new URL(`alerts/${alertId}`, env.API_URL),
      method: "PATCH",
      body: raw.trim().length > 0 ? raw : "{}",
      connectErrorMessage: CONNECT_ERROR,
    });
  } catch (error) {
    console.error("[api/alerts/:id PATCH]", error);
    return NextResponse.json(
      { message: "Erro interno ao atualizar alerta." },
      { status: 500 },
    );
  }
}
