/**
 * Auth helper to get current user
 * 
 * SECURITY WARNING: This is a placeholder implementation that returns the first active user.
 * In production, this MUST be replaced with proper session-based user identification
 * to prevent unauthorized access to user-specific resources like saved views.
 * 
 * TODO: Implement proper user session tracking with authentication tokens/cookies
 */

import { prisma } from "@/lib/prisma";

/**
 * Get current user from request
 * For now, returns the first active user as a placeholder
 * TODO: Implement proper user session tracking
 */
export async function getCurrentUser() {
  // Placeholder: Get first active user
  // In production, this should get user from session/JWT
  const user = await prisma.user.findFirst({
    where: { isActive: true },
  });
  
  return user;
}
