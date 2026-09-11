import { COOKIE_NAMES } from "@/http/cookies/options";

export type ParsedCookie = {
  name: string;
  value: string;
  path?: string;
  domain?: string;
  maxAge?: number;
  expires?: Date;
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
};

const ALLOWED_COOKIE_NAMES = new Set<string>(Object.values(COOKIE_NAMES));

export function extractCookies(
  setCookieHeader: string | null,
  allowedNames?: Set<string>,
): ParsedCookie[] {
  if (!setCookieHeader) return [];

  const cookieStrings = splitSetCookieHeader(setCookieHeader);
  const parsed: ParsedCookie[] = [];
  const allowlist = allowedNames ?? ALLOWED_COOKIE_NAMES;

  for (const cookieStr of cookieStrings) {
    const parts = cookieStr
      .split(";")
      .map((p) => p.trim())
      .filter(Boolean);

    if (parts.length === 0) continue;

    const [nameValue, ...attributes] = parts;
    const eqIndex = nameValue.indexOf("=");

    if (eqIndex === -1) continue;

    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();

    if (!name || !allowlist.has(name) || !value) continue;

    const cookie: ParsedCookie = { name, value };

    for (const attr of attributes) {
      const attrEqIndex = attr.indexOf("=");
      const key = (attrEqIndex === -1 ? attr : attr.slice(0, attrEqIndex))
        .trim()
        .toLowerCase();
      const val = attrEqIndex === -1 ? "" : attr.slice(attrEqIndex + 1).trim();

      switch (key) {
        case "path":
          cookie.path = val;
          break;
        case "domain":
          cookie.domain = val;
          break;
        case "max-age":
          cookie.maxAge = Number(val);
          break;
        case "expires":
          cookie.expires = new Date(val);
          break;
        case "httponly":
          cookie.httpOnly = true;
          break;
        case "secure":
          cookie.secure = true;
          break;
        case "samesite": {
          const sameSite = val.toLowerCase();
          if (
            sameSite === "lax" ||
            sameSite === "strict" ||
            sameSite === "none"
          ) {
            cookie.sameSite = sameSite;
          }
          break;
        }
      }
    }

    parsed.push(cookie);
  }

  return parsed;
}

function splitSetCookieHeader(header: string): string[] {
  const result: string[] = [];
  let start = 0;
  let inExpires = false;

  for (let i = 0; i < header.length; i++) {
    const curr = header[i];

    if (!inExpires && header.slice(i, i + 8).toLowerCase() === "expires=") {
      inExpires = true;
      i += 7;
      continue;
    }

    if (inExpires && curr === ";") {
      inExpires = false;
      continue;
    }

    if (!inExpires && curr === ",") {
      result.push(header.slice(start, i).trim());
      start = i + 1;
    }
  }

  result.push(header.slice(start).trim());
  return result.filter(Boolean);
}
