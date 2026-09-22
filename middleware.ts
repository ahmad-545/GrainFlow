import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { jwtVerify } from "jose";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "grainflow_super_secure_mandi_secret_key_2026_jwt"
);

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public paths: static assets, media, public auth endpoints, login & forgot-password pages
  const isPublicAuthRoute =
    pathname === "/api/auth/login" ||
    pathname === "/api/auth/forgot-password" ||
    pathname === "/api/auth/reset-password";

  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/videos") ||
    pathname.startsWith("/images") ||
    pathname.endsWith(".mp4") ||
    pathname.endsWith(".webm") ||
    pathname.endsWith(".jpg") ||
    pathname.endsWith(".jpeg") ||
    pathname.endsWith(".png") ||
    pathname.endsWith(".svg") ||
    pathname.endsWith(".webp") ||
    pathname.startsWith("/favicon.ico") ||
    isPublicAuthRoute ||
    pathname === "/login" ||
    pathname === "/forgot-password"
  ) {
    return NextResponse.next();
  }

  const token = request.cookies.get("grainflow_session")?.value;

  if (!token) {
    // If accessing an API route without valid session, return 401 Unauthorized
    if (pathname.startsWith("/api")) {
      return NextResponse.json({ error: "Unauthorized. Please log in." }, { status: 401 });
    }
    // Redirect unauthenticated web page visitors to login
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }

  try {
    await jwtVerify(token, JWT_SECRET);
    return NextResponse.next();
  } catch {
    // Invalid or expired token
    if (pathname.startsWith("/api")) {
      return NextResponse.json(
        { error: "Session expired or invalid. Please log in again." },
        { status: 401 }
      );
    }
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
