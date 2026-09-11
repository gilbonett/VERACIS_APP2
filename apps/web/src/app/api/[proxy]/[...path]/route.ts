import { getCookiesFromHeaders } from "@/http/utils/get-cookies-from-headers";
import { env } from "@/public-env";
import { headers } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

async function handler(
  request: NextRequest,
  { params }: { params: Promise<{ path: string[] }> },
) {
  const incomingHeaders = await headers();

  const { path } = await params;
  const url = new URL(path.join("/"), env.API_URL);

  request.nextUrl.searchParams.forEach((value, key) => {
    url.searchParams.set(key, value);
  });

  const requestInit: RequestInit = {
    method: request.method,
    headers: getCookiesFromHeaders(incomingHeaders),
  };

  if (!["GET", "HEAD"].includes(request.method)) {
    requestInit.body = await request.text();
  }

  const response = await fetch(url, requestInit);

  if (response.status === 204 || response.status === 304) {
    return new NextResponse(null, {
      status: response.status,
      headers: response.headers,
    });
  }

  const data = await response.text();

  return new NextResponse(data, {
    status: response.status,
    headers: response.headers,
  });
}

export const GET = handler;
export const POST = handler;
export const PUT = handler;
export const PATCH = handler;
export const DELETE = handler;
