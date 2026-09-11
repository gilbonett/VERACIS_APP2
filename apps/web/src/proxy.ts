import { NextRequest, NextResponse } from "next/server";
import { hasAuthenticated } from "./auth/has-authenticated";
import { env } from "./public-env";

function redirectTo(request: NextRequest, pathname: string) {
  const base = env.APP_URL ?? request.nextUrl.origin;
  return NextResponse.redirect(new URL(pathname, base));
}

export default async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return redirectTo(request, "/map");
  }

  if (pathname.startsWith("/map")) {
    return NextResponse.next();
  }

  const isAuthenticated = await hasAuthenticated();
  const isAuthRoute = pathname.startsWith("/auth/");

  if (isAuthenticated && isAuthRoute) {
    return redirectTo(request, "/map");
  }

  if (!isAuthenticated && !isAuthRoute) {
    return redirectTo(request, "/map");
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - static file extensions (images, fonts, etc.)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:png|jpg|jpeg|gif|svg|webp|ico|woff|woff2|ttf|otf|css|js)).*)",
  ],
};
