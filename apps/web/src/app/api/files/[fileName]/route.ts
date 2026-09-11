import { decodeFileNameParamForS3Key } from "@/lib/decode-file-name-param";
import { env } from "@/public-env";
import { NextRequest, NextResponse } from "next/server";

type RouteContext = {
  params: Promise<{ fileName: string }>;
};

export async function GET(_request: NextRequest, { params }: RouteContext) {
  const { fileName } = await params;
  if (!fileName?.trim()) {
    return NextResponse.json(
      { message: "Nome do ficheiro em falta." },
      { status: 400 },
    );
  }

  const s3Key = decodeFileNameParamForS3Key(fileName);
  const target = new URL(`files/${encodeURIComponent(s3Key)}`, env.API_URL);

  try {
    const res = await fetch(target, { method: "GET", cache: "no-store" });
    const headers = new Headers();
    const ct = res.headers.get("content-type");
    if (ct) headers.set("Content-Type", ct);
    const cl = res.headers.get("content-length");
    if (cl) headers.set("Content-Length", cl);
    if (res.ok) {
      headers.set("Cache-Control", "public, max-age=31536000");
    }
    if (res.body) {
      return new NextResponse(res.body, { status: res.status, headers });
    }
    const buf = await res.arrayBuffer();
    return new NextResponse(buf, { status: res.status, headers });
  } catch (error) {
    console.error("[api/files/:fileName GET]", error);
    return NextResponse.json(
      { message: "Não foi possível obter o ficheiro." },
      { status: 503 },
    );
  }
}
