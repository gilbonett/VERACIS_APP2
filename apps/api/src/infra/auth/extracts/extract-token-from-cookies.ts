import { Request } from "express";

export function extractTokenFromCookies(
  req: Request,
  tokenName: string,
): string | null {
  const token = req.cookies[tokenName];

  if (!token) return null;

  return token;
}
