export type ParsedCookie = {
  name: string;
  value: string;
  httpOnly: boolean;
  secure: boolean;
  sameSite: "strict" | "lax" | "none" | undefined;
  maxAge: number | undefined;
  expires: Date | undefined;
  path: string | undefined;
  domain: string | undefined;
};

export function extractCookies(setCookieHeader: string): ParsedCookie[] {
  const cookieStrings = setCookieHeader.split(/,(?=[^ ])/);

  return cookieStrings.map((cookieStr) => {
    const parts = cookieStr.split(";").map((p) => p.trim());
    const [nameValue, ...attributes] = parts;
    const eqIndex = nameValue.indexOf("=");
    const name = nameValue.slice(0, eqIndex).trim();
    const value = nameValue.slice(eqIndex + 1).trim();

    const attrs: Record<string, string> = {};
    for (const attr of attributes) {
      const eqIdx = attr.indexOf("=");
      if (eqIdx === -1) {
        attrs[attr.toLowerCase()] = "true";
      } else {
        attrs[attr.slice(0, eqIdx).trim().toLowerCase()] = attr
          .slice(eqIdx + 1)
          .trim();
      }
    }

    const maxAgeRaw = attrs["max-age"];
    const maxAge = maxAgeRaw ? parseInt(maxAgeRaw, 10) : undefined;

    const expiresRaw = attrs["expires"];
    const expires = expiresRaw ? new Date(expiresRaw) : undefined;

    return {
      name,
      value,
      httpOnly: "httponly" in attrs,
      secure: "secure" in attrs,
      sameSite: attrs["samesite"] as ParsedCookie["sameSite"],
      maxAge,
      expires,
      path: attrs["path"],
      domain: attrs["domain"],
    };
  });
}
