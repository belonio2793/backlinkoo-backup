/**
 * Utility to ensure proper spacing after colons in text
 */

/**
 * Ensures there's exactly one space after every colon when followed by letters/characters
 */
export function ensureColonSpacing(text: string): string {
  if (!text || typeof text !== 'string') {
    return text || '';
  }

  // Replace any colon followed immediately by non-whitespace with colon + space
  return text.replace(/:(?!\s)/g, ': ');
}

/**
 * Format time display with proper colon spacing
 */
export function formatTimeDisplay(label: string, date: Date): string {
  const timeString = date.toLocaleTimeString();
  return ensureColonSpacing(`${label}: ${timeString}`);
}

/**
 * Format status text with proper colon spacing
 */
export function formatStatusText(label: string, status: string): string {
  return ensureColonSpacing(`${label}: ${status}`);
}

/**
 * Apply colon spacing fix to any text content
 */
export function fixTextColonSpacing(text: string): string {
  return ensureColonSpacing(text);
}

// Export for global use
if (typeof window !== 'undefined') {
  (window as any).ensureColonSpacing = ensureColonSpacing;
  (window as any).formatTimeDisplay = formatTimeDisplay;
}
