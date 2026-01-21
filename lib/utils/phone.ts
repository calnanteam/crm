/**
 * Normalizes a phone number by removing all non-digit characters.
 * This allows for flexible phone number searching regardless of formatting.
 * 
 * @param phone - The phone number to normalize (can be undefined or null)
 * @returns The normalized phone number with only digits, or undefined if input is falsy or has no digits
 * 
 * @example
 * normalizePhone("(555) 123-4567") // returns "5551234567"
 * normalizePhone("555-1234") // returns "5551234"
 * normalizePhone("") // returns undefined
 * normalizePhone(null) // returns undefined
 */
export function normalizePhone(phone: string | undefined | null): string | undefined {
  if (!phone) return undefined;
  const normalized = phone.replace(/\D/g, '');
  return normalized || undefined;
}
