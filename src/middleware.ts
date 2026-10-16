import { NextRequest, NextResponse } from "next/server";
import createMiddleware from "next-intl/middleware";
import { routing } from "./i18n/routing";

const intlMiddleware = createMiddleware(routing);

function authorized(request: NextRequest) {
  const username = process.env.ADMIN_USERNAME;
  const password = process.env.ADMIN_PASSWORD;
  const header = request.headers.get("authorization");
  if (!username || !password || !header?.startsWith("Basic ")) return false;
  try {
    const decoded = new TextDecoder().decode(Uint8Array.from(atob(header.slice(6)), c => c.charCodeAt(0)));
    const separator = decoded.indexOf(":");
    if (separator < 0) return false;
    const user = decoded.slice(0, separator);
    const pass = decoded.slice(separator + 1);
    return user === username && pass === password;
  } catch { return false; }
}

export default function middleware(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/admin")) {
    if (!authorized(request)) {
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
