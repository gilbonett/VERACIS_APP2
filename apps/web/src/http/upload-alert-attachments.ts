import { getApiErrorMessage } from "@/http/parse-api-error-message";

const DEFAULT_UPLOAD_ERROR = "Não foi possível enviar a imagem.";

type UploadJson = {
  attachmentId?: unknown;
  url?: unknown;
};

export async function uploadAlertAttachmentFiles(
  alertId: string,
  files: File[],
): Promise<{ ok: true } | { ok: false; message: string }> {
  for (const file of files) {
    const fd = new FormData();
    fd.append("file", file, file.name || "image");

    const uploadUrl = new URL("/api/attachments", window.location.origin);
    uploadUrl.searchParams.set("scope", "ALERT");
    uploadUrl.searchParams.set("path", "alert");

    let up: Response;
    try {
      up = await fetch(uploadUrl.toString(), {
        method: "POST",
        body: fd,
        credentials: "include",
      });
    } catch {
      return {
        ok: false,
        message:
          "Falha de rede ao enviar a imagem. Verifique a ligação e tente novamente.",
      };
    }

    if (!up.ok) {
      const message = await getApiErrorMessage(up, DEFAULT_UPLOAD_ERROR);
      return { ok: false, message };
    }

    let parsed: UploadJson;
    try {
      parsed = (await up.json()) as UploadJson;
    } catch {
      return { ok: false, message: "Resposta inválida ao enviar arquivo." };
    }

    const attachmentId =
      typeof parsed.attachmentId === "string" ? parsed.attachmentId : "";
    if (!attachmentId) {
      return { ok: false, message: "ID do anexo não retornado pela API." };
    }

    const link = await fetch("/api/alerts/attachments", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ attachmentId, alertId }),
    });

    if (!link.ok) {
      const message = await getApiErrorMessage(
        link,
        "Não foi possível vincular a imagem ao alerta.",
      );
      return { ok: false, message };
    }
  }

  return { ok: true };
}
