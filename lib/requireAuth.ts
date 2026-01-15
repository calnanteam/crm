/**
 * Centralized API route authentication enforcement
 * Ensures every API handler explicitly checks auth before processing requests
 */

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { AUTH_COOKIE_NAME } from "./auth";

/**
 * Enforce authentication for API routes
 * Returns 401 if not authenticated, otherwise returns null (success)
 * 
 * Usage in API routes:
 * ```
 * const authError = await requireAuth();
 * if (authError) return authError;
 * ```
 */
export async function requireAuth(): Promise<NextResponse | null> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  
  // Check if cookie exists and has valid value
  const isAuthenticated = authCookie?.value === "1";
  
  if (!isAuthenticated) {
    return NextResponse.json(
      { error: "Unauthorized" },
      { status: 401 }
    );
  }
  
  // Success - caller can proceed
  return null;
}
