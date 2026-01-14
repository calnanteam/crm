/**
 * Utility functions for email pattern matching.
 * Used for ignored senders and do-not-reply lists.
 */

/**
 * Check if an email address matches a pattern.
 * Patterns can be:
 * - Exact email: "joe@vendor.com" (case-insensitive)
 * - Domain: "@vendor.com" (matches vendor.com AND all subdomains like sub.vendor.com)
 */
export function matchesPattern(email: string, pattern: string): boolean {
  if (!email || !pattern) return false;
  
  const normalizedEmail = email.toLowerCase().trim();
  const normalizedPattern = pattern.toLowerCase().trim();
  
  // Domain pattern (starts with @)
  if (normalizedPattern.startsWith('@')) {
    // Extract base domain from pattern (remove @ prefix)
    const baseDomain = normalizedPattern.substring(1);
    
    // Extract domain from email (part after last @)
    const atIndex = normalizedEmail.lastIndexOf('@');
    if (atIndex === -1) return false;
    
    const emailDomain = normalizedEmail.substring(atIndex + 1);
    
    // Match if domain equals baseDomain OR is a subdomain of baseDomain
    return emailDomain === baseDomain || emailDomain.endsWith('.' + baseDomain);
  }
  
  // Exact email match
  return normalizedEmail === normalizedPattern;
}

/**
 * Check if an email address matches any pattern in a set.
 */
export function matchesAnyPattern(email: string, patterns: Set<string>): boolean {
  if (!email || patterns.size === 0) return false;
  
  for (const pattern of patterns) {
    if (matchesPattern(email, pattern)) {
      return true;
    }
  }
  
  return false;
}

/**
 * Extract domain from email address (with @ prefix for consistency).
 * Example: "joe@vendor.com" -> "@vendor.com"
 */
export function extractDomain(email: string): string {
  if (!email || typeof email !== 'string') return '';
  
  // Count @ symbols - valid emails have exactly one
  const atCount = (email.match(/@/g) || []).length;
  if (atCount !== 1) return '';
  
  const atIndex = email.lastIndexOf('@');
  if (atIndex === -1 || atIndex === email.length - 1) return '';
  
  const domain = email.substring(atIndex).toLowerCase();
  return domain;
}
