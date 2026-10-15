import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";
import { isAdminAuthorized } from "@/lib/admin-auth";

const intlMiddleware = createMiddleware(routing);

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!isAdminAuthorized(request)) {
      return new NextResponse("Admin authentication required.", {
        status: 401,
        headers: { "WWW-Authenticate": 'Basic realm="HealthGuide Admin", charset="UTF-8"', "Cache-Control": "no-store" },
      });
    }
    return NextResponse.next();
  }
  return intlMiddleware(request);
}

export const config = { matcher: ["/admin/:path*", "/((?!api|_next|_vercel|.*\\..*).*)"] };
