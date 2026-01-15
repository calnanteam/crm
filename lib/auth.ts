/**
 * Simple cookie-based authentication utilities with HMAC signing
 * Replaces NextAuth with password-protected access
 */

import { cookies } from "next/headers";

export const AUTH_COOKIE_NAME = "ai_email_auth";

/**
 * Get or generate AUTH_SECRET from environment
 */
function getAuthSecret(): string {
  const secret = process.env.AUTH_SECRET;
  if (!secret) {
    throw new Error("AUTH_SECRET environment variable is required");
  }
  return secret;
}

/**
 * Sign a value with HMAC-SHA256 (browser-compatible version)
 */
async function signValue(value: string): Promise<string> {
  const secret = getAuthSecret();
  const encoder = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return Array.from(new Uint8Array(signature))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

/**
 * Create a signed authentication token
 */
export async function createAuthToken(): Promise<string> {
  const timestamp = Date.now().toString();
  const signature = await signValue(timestamp);
  return `${timestamp}.${signature}`;
}

/**
 * Verify a signed authentication token
 */
export async function verifyAuthToken(token: string): Promise<boolean> {
  try {
    const [timestamp, signature] = token.split(".");
    if (!timestamp || !signature) {
      return false;
    }
    
    const expectedSignature = await signValue(timestamp);
    
    // Constant-time comparison
    if (signature.length !== expectedSignature.length) {
      return false;
    }
    
    let result = 0;
    for (let i = 0; i < signature.length; i++) {
      result |= signature.charCodeAt(i) ^ expectedSignature.charCodeAt(i);
    }
    
    return result === 0;
  } catch (error) {
    console.error("Error verifying auth token:", error);
    return false;
  }
}

/**
 * Check if the user is authenticated by checking for the auth cookie
 */
export async function isAuthenticated(): Promise<boolean> {
  try {
    const cookieStore = await cookies();
    const authCookie = cookieStore.get(AUTH_COOKIE_NAME);
    
    if (!authCookie?.value) {
      return false;
    }
    
    return await verifyAuthToken(authCookie.value);
  } catch (error) {
    console.error("Error checking authentication:", error);
    return false;
  }
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
