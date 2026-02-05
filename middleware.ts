import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { AUTH_COOKIE_NAME, verifyAuthToken } from "@/lib/auth";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Allow public paths without authentication
  const publicPaths = ["/login", "/api/auth/login", "/api/auth/logout"];
  
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for auth cookie and verify signature
  const authCookie = request.cookies.get(AUTH_COOKIE_NAME);
  
  let isAuthenticated = false;
  if (authCookie?.value) {
    isAuthenticated = await verifyAuthToken(authCookie.value);
  }
  
  // Redirect to login if not authenticated
  if (!isAuthenticated) {
    const loginUrl = new URL("/login", request.url);
    return NextResponse.redirect(loginUrl);
  }
  
  // Allow authenticated requests
  return NextResponse.next();
}

// Configure which routes to protect
export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (images, etc.)
     */
    "/((?!_next/static|_next/image|favicon.ico|.*\\.png|.*\\.jpg|.*\\.jpeg|.*\\.gif|.*\\.svg).*)",
  ],
};
