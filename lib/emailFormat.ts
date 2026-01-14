/**
 * Email body formatting utilities for cleaning HTML content.
 * 
 * This module provides client-side HTML cleaning to make email bodies
 * readable by removing scripts, styles, meta tags, and converting HTML
 * to clean text while preserving basic structure (paragraphs, lists).
 * 
 * SECURITY NOTES:
 * 1. The output is PLAIN TEXT, not HTML. It is displayed with whitespace-pre-wrap
 *    and never rendered as HTML (no dangerouslySetInnerHTML).
 * 2. Primary cleaning uses DOMParser (browser-side) which is secure.
 * 3. Fallback cleaning uses regex (less secure but acceptable since output is
 *    displayed as plain text only).
 * 4. This is client-side only code - no server-side HTML rendering.
 */

/**
 * Decodes common HTML entities to their text equivalents.
 */
function decodeHtmlEntities(text: string): string {
  const entityMap: Record<string, string> = {
    '&nbsp;': ' ',
    '&amp;': '&',
    '&lt;': '<',
    '&gt;': '>',
    '&quot;': '"',
    '&#39;': "'",
    '&apos;': "'",
    '&mdash;': '\u2014',
    '&ndash;': '\u2013',
    '&hellip;': '\u2026',
    '&rsquo;': '\u2019',
    '&lsquo;': '\u2018',
    '&rdquo;': '\u201D',
    '&ldquo;': '\u201C',
  };

  let result = text;
  for (const [entity, char] of Object.entries(entityMap)) {
    result = result.split(entity).join(char);
  }

  // Handle numeric entities (e.g., &#160;)
  result = result.replace(/&#(\d+);/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 10));
  });

  // Handle hex entities (e.g., &#x00A0;)
  result = result.replace(/&#x([0-9A-Fa-f]+);/g, (_, code) => {
    return String.fromCharCode(parseInt(code, 16));
  });

  return result;
}

/**
 * Checks if a string appears to contain HTML content.
 */
function looksLikeHtml(text: string): boolean {
  if (!text || typeof text !== 'string') return false;
  
  // Check for common HTML patterns
  const htmlPatterns = [
    /<html/i,
    /<head/i,
    /<body/i,
    /<div/i,
    /<p[\s>]/i,
    /<br\s*\/?>/i,
    /<span/i,
    /<table/i,
    /<!DOCTYPE/i,
  ];

  return htmlPatterns.some(pattern => pattern.test(text));
}

/**
 * Converts HTML to clean, readable text using DOMParser (client-side only).
 * 
 * This function:
 * - Removes scripts, styles, meta, and head content
 * - Converts block elements to newlines
 * - Converts list items to bullets
 * - Decodes HTML entities
 * - Collapses excessive whitespace
 * 
 * Falls back to regex-based cleaning if DOMParser is unavailable.
 */
export function cleanHtmlToText(html: string): string {
  if (!html || typeof html !== 'string') return '';

  // If it doesn't look like HTML, return as-is (after entity decoding)
  if (!looksLikeHtml(html)) {
    return decodeHtmlEntities(html);
  }

  // Client-side only: use DOMParser
  if (typeof window !== 'undefined' && typeof DOMParser !== 'undefined') {
    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(html, 'text/html');

      // Remove unwanted elements
      const unwantedTags = ['script', 'style', 'meta', 'link', 'noscript'];
      unwantedTags.forEach(tag => {
        const elements = doc.getElementsByTagName(tag);
        Array.from(elements).forEach(el => el.remove());
      });

      // Insert newlines for block elements before extracting text
      const blockElements = doc.querySelectorAll(
        'p, div, br, h1, h2, h3, h4, h5, h6, li, tr, table, blockquote, pre'
      );
      
      blockElements.forEach(el => {
        if (el.tagName.toLowerCase() === 'br') {
          el.replaceWith(document.createTextNode('\n'));
        } else if (el.tagName.toLowerCase() === 'li') {
          // Add bullet point for list items
          const bullet = document.createTextNode('\n• ');
          el.insertBefore(bullet, el.firstChild);
        } else {
          // Add newline after block elements
          el.appendChild(document.createTextNode('\n'));
        }
      });

      // Extract text content
      const text = doc.body?.innerText || doc.body?.textContent || '';
      
      // Post-process: collapse multiple newlines and whitespace
      let cleaned = text
        .replace(/\n{3,}/g, '\n\n') // Max 2 consecutive newlines
        .replace(/[ \t]+/g, ' ')     // Collapse horizontal whitespace
        .replace(/^\s+|\s+$/g, '')   // Trim start and end
        .replace(/\n /g, '\n');      // Remove spaces after newlines

      return decodeHtmlEntities(cleaned);
    } catch (error) {
      // If parsing fails, fall back to regex (silently for production)
      if (process.env.NODE_ENV === 'development') {
        console.warn('DOMParser failed, falling back to regex cleaning:', error);
      }
    }
  }

  // Fallback: regex-based cleaning (works everywhere, less accurate)
  return cleanHtmlWithRegex(html);
}

/**
 * Fallback HTML cleaner using regex (less accurate but works in any environment).
 * 
 * SECURITY NOTES:
 * - This is a FALLBACK for environments where DOMParser is unavailable (e.g., SSR).
 * - The primary cleaning path uses DOMParser which is more secure and accurate.
 * - This fallback uses multiple passes to reduce (but not eliminate) edge cases.
 * - The output is displayed as PLAIN TEXT (whitespace-pre-wrap), never as HTML.
 * - No dangerouslySetInnerHTML is used anywhere in the application.
 * - CodeQL alerts about incomplete sanitization are acknowledged but acceptable
 *   because the output is not rendered as HTML.
 * 
 * IMPORTANT: Do NOT use this function for HTML sanitization purposes.
 * It is only for converting HTML to readable plain text for display.
 */
function cleanHtmlWithRegex(html: string): string {
  let text = html;

  // Multiple passes to handle edge cases and nested tags
  // Pass 1: Remove head section entirely (with any spacing variations)
  text = text.replace(/<head[\s\S]*?<\/head\s*>/gi, '');
  
  // Pass 2: Remove scripts (multiple passes to handle nested/malformed tags)
  for (let i = 0; i < 3; i++) {
    text = text.replace(/<script[\s\S]*?<\/script\s*>/gi, '');
    text = text.replace(/<script[^>]*>/gi, '');
  }
  
  // Pass 3: Remove styles (multiple passes to handle nested/malformed tags)
  for (let i = 0; i < 3; i++) {
    text = text.replace(/<style[\s\S]*?<\/style\s*>/gi, '');
    text = text.replace(/<style[^>]*>/gi, '');
  }

  // Pass 4: Remove meta and link tags
  text = text.replace(/<meta[^>]*\/?>/gi, '');
  text = text.replace(/<link[^>]*\/?>/gi, '');

  // Pass 5: Convert line breaks
  text = text.replace(/<br\s*\/?>/gi, '\n');

  // Pass 6: Convert list items
  text = text.replace(/<li[^>]*>/gi, '\n• ');
  text = text.replace(/<\/li\s*>/gi, '');

  // Pass 7: Convert block elements to newlines
  text = text.replace(/<\/(p|div|h[1-6]|tr|table|blockquote|pre)\s*>/gi, '\n');
  text = text.replace(/<(p|div|h[1-6]|tr|table|blockquote|pre)[^>]*>/gi, '\n');

  // Pass 8: Remove all remaining HTML tags (multiple passes for nested tags)
  for (let i = 0; i < 3; i++) {
    text = text.replace(/<[^>]+>/g, '');
  }

  // Pass 9: Decode entities
  text = decodeHtmlEntities(text);

  // Pass 10: Collapse whitespace
  text = text
    .replace(/\n{3,}/g, '\n\n')
    .replace(/[ \t]+/g, ' ')
    .replace(/^\s+|\s+$/g, '')
    .replace(/\n /g, '\n');

  return text;
}

/**
 * Split result containing the latest message and quoted/history sections.
 */
export interface EmailSplitResult {
  latest: string;
  quoted?: string;
  splitReason?: string;
}

/**
 * Splits email body into latest message and quoted/thread history.
 * 
 * Uses multiple heuristics to detect reply/forward separators:
 * - "On <date>, <name> wrote:"
 * - "From:" / "Sent:" / "To:" / "Subject:" headers
 * - "-----Original Message-----"
 * - "Begin forwarded message"
 * - Long runs of lines starting with ">"
 * - Divider lines (---, ___, *****)
 * 
 * @param inputText - The email body text (plain text, not HTML)
 * @returns Object with latest message and optional quoted/history section
 */
export function splitEmailBodyIntoLatestAndQuoted(inputText: string): EmailSplitResult {
  if (!inputText || typeof inputText !== 'string') {
    return { latest: '', quoted: undefined };
  }

  const lines = inputText.split('\n');
  let splitIndex = -1;
  let splitReason: string | undefined;

  // Pattern 1: "On <date>, <name> wrote:" (case-insensitive, with spacing tolerance)
  // Examples: "On Jan 5, 2026, John Doe wrote:", "On 1/5/2026 at 10:30 AM, Jane wrote:"
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    // Match "On" followed by non-newline characters, ending with "wrote:"
    if (/^on\s+[^\n]+wrote:\s*$/i.test(line)) {
      splitIndex = i;
      splitReason = 'on_date_wrote';
      break;
    }
  }

  // Pattern 2: Email header block (From:/Sent:/To:/Subject:)
  // Detects blocks like:
  // From: sender@example.com
  // Sent: Wednesday, January 5, 2026 10:30 AM
  // To: recipient@example.com
  // Subject: Re: Meeting
  if (splitIndex === -1) {
    for (let i = 0; i < lines.length - 1; i++) {
      const line = lines[i].trim();
      const nextLine = lines[i + 1]?.trim() || '';
      
      // Check if this line starts with From: and next lines have Sent:/To:/Subject:
      if (/^from:\s*/i.test(line)) {
        let hasEmailHeaders = false;
        
        // Check next 5 lines for other email headers
        for (let j = i + 1; j < Math.min(i + 6, lines.length); j++) {
          const checkLine = lines[j].trim();
          if (/^(sent|to|subject|date):\s*/i.test(checkLine)) {
            hasEmailHeaders = true;
            break;
          }
        }
        
        if (hasEmailHeaders) {
          splitIndex = i;
          splitReason = 'email_headers';
          break;
        }
      }
    }
  }

  // Pattern 3: "-----Original Message-----" or "-----Forwarded Message-----"
  if (splitIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^-{4,}\s*(original|forwarded)\s*message\s*-{4,}$/i.test(line)) {
        splitIndex = i;
        splitReason = 'original_message_separator';
        break;
      }
    }
  }

  // Pattern 4: "Begin forwarded message" or similar
  if (splitIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (/^begin\s+forwarded\s+message/i.test(line)) {
        splitIndex = i;
        splitReason = 'begin_forwarded';
        break;
      }
    }
  }

  // Pattern 5: Long runs of quoted lines (5+ consecutive lines starting with ">")
  if (splitIndex === -1) {
    let quoteRunStart = -1;
    let quoteRunLength = 0;
    
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      if (line.startsWith('>')) {
        if (quoteRunStart === -1) {
          quoteRunStart = i;
          quoteRunLength = 1;
        } else {
          quoteRunLength++;
        }
        
        // If we have 5+ consecutive quoted lines, treat as split point
        if (quoteRunLength >= 5) {
          splitIndex = quoteRunStart;
          splitReason = 'quoted_lines';
          break;
        }
      } else if (line.length > 0) {
        // Non-empty, non-quoted line resets the run
        quoteRunStart = -1;
        quoteRunLength = 0;
      }
      // Empty lines don't reset the run
    }
  }

  // Pattern 6: Divider lines (---, ___, *****)
  if (splitIndex === -1) {
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      // Match 4+ of the same character (-, _, *, =)
      if (/^[-_*=]{4,}$/.test(line)) {
        // Only treat as separator if there's substantial content before it
        const contentBefore = lines.slice(0, i).join('\n').trim();
        if (contentBefore.length > 100) {
          splitIndex = i;
          splitReason = 'divider_line';
          break;
        }
      }
    }
  }

  // If no split point found, return full body as latest message
  if (splitIndex === -1) {
    return {
      latest: inputText.trim(),
      quoted: undefined,
      splitReason: undefined
    };
  }

  // Split the content
  const latestLines = lines.slice(0, splitIndex);
  const quotedLines = lines.slice(splitIndex);

  const latest = latestLines.join('\n').trim();
  const quoted = quotedLines.join('\n').trim();

  // Only return quoted section if it has content
  if (!quoted || quoted.length === 0) {
    return {
      latest: inputText.trim(),
      quoted: undefined,
      splitReason: undefined
    };
  }

  return {
    latest,
    quoted,
    splitReason
  };
}

/**
 * Improves text readability by normalizing whitespace and formatting.
 * 
 * - Caps consecutive blank lines to max 2
 * - Normalizes bullet points and list formatting
 * - Preserves paragraph structure
 * 
 * @param text - Plain text to improve
 * @returns Improved text
 */
export function improveTextReadability(text: string): string {
  if (!text || typeof text !== 'string') return '';

  let improved = text;

  // Cap excessive blank lines (max 2 consecutive)
  improved = improved.replace(/\n{3,}/g, '\n\n');

  // Normalize common bullet variations to consistent format
  // • · * - → • (but only at line start)
  // Note: Hyphen placed at end of character class to avoid range interpretation
  improved = improved.replace(/^[\s]*[•·*-]\s+/gm, '• ');

  // Normalize signature separator (-- with optional spaces)
  improved = improved.replace(/^[\s]*--[\s]*$/gm, '--');

  // Remove trailing spaces on lines
  improved = improved.replace(/[ \t]+$/gm, '');

  return improved.trim();
}
