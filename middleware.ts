import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken } from "@/lib/auth/tokens";

// Routes that require authentication
const protectedRoutes = [
  "/dashboard",
  "/wallet",
  "/profile",
  "/basket-goals",
  "/market",
];

// Routes that should redirect to dashboard if authenticated
const authRoutes = ["/auth"];

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Get access token from cookies
  const accessToken = req.cookies.get("access_token")?.value;

  // Verify token
  let isAuthenticated = false;
  if (accessToken) {
    const payload = await verifyAccessToken(accessToken);
    isAuthenticated = !!payload;
  }

  // Check if current path is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );

  // Check if current path is an auth route
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  // Redirect unauthenticated users from protected routes to auth
  if (isProtectedRoute && !isAuthenticated) {
    const url = new URL("/auth", req.url);
    return NextResponse.redirect(url);
  }

  // We intentionally skip redirecting from "/auth" to "/dashboard" here 
  // because Edge middleware cannot consult the Postgres DB to check if the session is revoked/suspended.
  // This prevents infinite redirect loops. That validation is now natively handled by the Auth Client.

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/wallet/:path*",
    "/profile/:path*",
    "/basket-goals/:path*",
    "/market/:path*",
    "/auth/:path*",
  ],
};
