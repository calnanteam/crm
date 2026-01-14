/**
 * AI SAFE MODE UTILITY
 * 
 * Provides utilities to detect and enforce "AI safe mode" for automated testing.
 * When safe mode is enabled, all mailbox-mutating actions are blocked at the UI level.
 * 
 * Activation:
 * - Environment variable: NEXT_PUBLIC_SAFE_MODE=1
 * - URL query parameter: ?safe=1
 * 
 * Safe mode blocks:
 * - Send email
 * - Delete email
 * - Move email
 * - Skip email (hide)
 * - Skip always (ignore sender)
 * - Flag email
 * - Create task
 * - Snooze email
 * 
 * Safe mode allows:
 * - Navigation
 * - Search
 * - View switching
 * - Reading emails
 */

/**
 * Check if safe mode is enabled via environment variable
 */
export function isSafeModeEnv(): boolean {
  // Check NEXT_PUBLIC_SAFE_MODE environment variable
  // NEXT_PUBLIC_ prefix makes this available on both client and server in Next.js
  try {
    return process.env.NEXT_PUBLIC_SAFE_MODE === "1";
  } catch {
    return false;
  }
}

/**
 * Check if safe mode is enabled via URL query parameter
 */
export function isSafeModeQuery(): boolean {
  if (typeof window === "undefined") return false;
  
  try {
    const params = new URLSearchParams(window.location.search);
    return params.get("safe") === "1";
  } catch {
    return false;
  }
}

/**
 * Check if safe mode is enabled (via env var OR query param)
 */
export function isSafeModeEnabled(): boolean {
  return isSafeModeEnv() || isSafeModeQuery();
}

/**
 * Get a user-friendly message explaining safe mode is active
 */
export function getSafeModeMessage(): string {
  return "Safe mode is active - mailbox mutations are disabled for testing";
}
