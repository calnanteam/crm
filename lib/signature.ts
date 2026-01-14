/**
 * Generates text-only signature for fallback (vertically stacked format)
 */
export function getTextSignature(): string {
  return `
Matt Calnan, CPA, CMA
Managing Director
Calnan Real Estate Group
matt@calnan.co
403-715-1170
  `.trim();
}

/**
 * Generates HTML signature for email replies
 * Uses image signature with text fallback (no duplication)
 * 
 * Email clients handle images differently:
 * - If image loads: Shows image only
 * - If image blocked/fails: Shows alt text (vertically stacked format)
 */
export function getEmailSignature(): string {
  // Image signature with comprehensive alt text fallback
  // Alt text displays in vertical format when image is blocked/unavailable
  const signatureHtml = `
<br><br>
<table cellpadding="0" cellspacing="0" border="0" style="border-collapse: collapse; font-family: Arial, sans-serif; font-size: 14px;">
  <tr>
    <td>
      <img 
        src="${process.env.NEXTAUTH_URL || 'http://localhost:3000'}/matt-signature.png" 
        alt="Matt Calnan, CPA, CMA
Managing Director
Calnan Real Estate Group
matt@calnan.co
403-715-1170"
        width="400"
        style="width: 400px; max-width: 100%; height: auto; display: block; border: 0;" 
      />
    </td>
  </tr>
</table>
  `.trim();

  return signatureHtml;
}

/**
 * Generates plain text signature for plain text emails
 */
export function getPlainTextSignature(): string {
  return `\n\n--\n${getTextSignature()}`;
}

/**
 * Appends HTML signature to reply text
 */
export function appendSignature(replyText: string): string {
  const signature = getEmailSignature();
  return `${replyText}\n\n${signature}`;
}

/**
 * Appends plain text signature to reply text
 */
export function appendPlainTextSignature(replyText: string): string {
  const signature = getPlainTextSignature();
  return `${replyText}${signature}`;
}
