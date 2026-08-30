import { NextRequest, NextResponse } from "next/server";
import { jwtVerify } from "jose";

const SESSION_COOKIE = "naydi_session";

const PROTECTED = ["/profile", "/orders", "/favorites", "/messages", "/business-dashboard", "/assistant"];
const ADMIN_ONLY = ["/admin"];

async function readSession(req: NextRequest): Promise<{ role?: string } | null> {
  const token = req.cookies.get(SESSION_COOKIE)?.value;
  if (!token) return null;
  try {
    const secret = new TextEncoder().encode(
      process.env.SESSION_SECRET || "dev-secret-change-me-in-production"
    );
    const { payload } = await jwtVerify(token, secret);
    return { role: payload.role as string | undefined };
  } catch {
    return null;
  }
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const needsAuth = PROTECTED.some((p) => pathname === p || pathname.startsWith(p + "/"));
  const needsAdmin = ADMIN_ONLY.some((p) => pathname === p || pathname.startsWith(p + "/"));
  if (!needsAuth && !needsAdmin) {
    if ((pathname === "/login" || pathname === "/register")) {
      const session = await readSession(req);
      if (session) return NextResponse.redirect(new URL("/home", req.url));
    }
    return NextResponse.next();
  }

  const session = await readSession(req);
  if (!session) {
    const url = new URL("/login", req.url);
    url.searchParams.set("next", pathname);
    return NextResponse.redirect(url);
  }
  if (needsAdmin && session.role !== "ADMIN") {
    return NextResponse.redirect(new URL("/home", req.url));
  }
  return NextResponse.next();
}

export const config = {
  matcher: [
    "/profile/:path*",
    "/orders/:path*",
    "/favorites/:path*",
    "/messages/:path*",
    "/business-dashboard/:path*",
    "/assistant/:path*",
    "/admin/:path*",
    "/login",
    "/register",
  ],
};
