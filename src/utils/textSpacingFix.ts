/**
 * Utility functions to ensure proper text spacing and formatting
 */

/**
 * Ensures proper spacing around colons in text
 */
export function fixColonSpacing(text: string): string {
  return text
    .replace(/(\w):\s*(\w)/g, '$1: $2') // Add space after colon if missing
    .replace(/:\s{2,}/g, ': '); // Remove extra spaces after colon
}

/**
 * Ensures proper spacing between numbers and words
 */
export function fixNumberSpacing(text: string): string {
  return text
    .replace(/(\d)([a-zA-Z])/g, '$1 $2') // Add space between number and letter
    .replace(/([a-zA-Z])(\d)/g, '$1 $2'); // Add space between letter and number
}

/**
 * Ensures proper spacing around plus signs
 */
export function fixPlusSpacing(text: string): string {
  return text
    .replace(/(\d)\+\s*([a-zA-Z])/g, '$1+ $2') // Ensure space after number+ before word
    .replace(/(\d)\s*\+([a-zA-Z])/g, '$1+ $2'); // Ensure space before word after +
}

/**
 * Comprehensive text spacing fix
 */
export function fixTextSpacing(text: string): string {
  return fixPlusSpacing(fixNumberSpacing(fixColonSpacing(text)));
}

/**
 * Format time string with proper spacing
 */
export function formatTimeWithSpacing(date: Date): string {
  const timeString = date.toLocaleTimeString();
  return fixTextSpacing(timeString);
}

/**
 * Format update text with proper spacing
 */
export function formatUpdateText(label: string, date: Date): string {
  const timeString = formatTimeWithSpacing(date);
  return `${label}: ${timeString}`;
}
