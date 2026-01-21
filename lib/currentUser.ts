/**
 * Auth helper to get current user
 * TODO: Replace with proper session-based user identification
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
