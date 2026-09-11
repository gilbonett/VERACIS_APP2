import { decodeFileNameParamForS3Key } from "@/lib/decode-file-name-param";
import { env } from "@/public-env";

const FILES_PREFIX = "/files/";

export function normalizeAlertAttachmentUrlForBrowser(url: string): string {
  const trimmed = url.trim();
  if (!trimmed) return trimmed;

  const apiBase = env.API_URL.replace(/\/$/, "");

  if (/^https?:\/\//i.test(trimmed)) {
    try {
      const u = new URL(trimmed);
      if (u.origin !== new URL(apiBase).origin) return trimmed;
      if (!u.pathname.startsWith(FILES_PREFIX)) return trimmed;
      const name = decodeFileNameParamForS3Key(
        u.pathname.slice(FILES_PREFIX.length),
      );
      if (!name) return trimmed;
      return `/api/files/${encodeURIComponent(name)}`;
    } catch {
      return trimmed;
    }
  }

  if (trimmed.startsWith(FILES_PREFIX)) {
    const name = decodeFileNameParamForS3Key(
      trimmed.slice(FILES_PREFIX.length),
    );
    if (!name) return trimmed;
    return `/api/files/${encodeURIComponent(name)}`;
  }

  if (trimmed.startsWith("/")) {
    return `${apiBase}${trimmed}`;
  }
  return `${apiBase}/${trimmed}`;
}
