/**
 * Simple cookie-based authentication utilities
 * Replaces NextAuth with password-protected access
 */

import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "ai_email_auth";

/**
 * Check if the user is authenticated by checking for the auth cookie
 */
export async function isAuthenticated(): Promise<boolean> {
  const cookieStore = await cookies();
  const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
  return authCookie?.value === "1";
}

/**
 * Verify the provided password against the environment variable
 */
export function verifyPassword(password: string): boolean {
  const correctPassword = process.env.APP_PASSWORD;
  
  if (!correctPassword) {
    console.error("APP_PASSWORD environment variable is not set");
    return false;
  }
  
  return password === correctPassword;
}
