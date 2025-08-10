/**
 * Utility to help identify and fix error display patterns
 * This helps find places where result.error is used directly without proper formatting
 */

export const errorDisplayPatterns = [
  // Direct result.error usage in toast descriptions
  /description:\s*result\.error/g,
  // Error object concatenation
  /error\.message\s*\|\|\s*error/g,
  // Direct error property access in descriptions
  /description:\s*.*\.error\b/g,
];

export const commonErrorDisplayFixes = {
  'description: result.error': 'description: formatErrorForUI(result.error)',
  'description: result.error || ': 'description: formatErrorForUI(result.error) || ',
  'error.message || error': 'formatErrorForUI(error)',
};

// Helper function to suggest fixes for error display patterns
export function suggestErrorDisplayFix(line: string): string | null {
  for (const [pattern, replacement] of Object.entries(commonErrorDisplayFixes)) {
    if (line.includes(pattern)) {
      return line.replace(pattern, replacement);
    }
  }
  return null;
}
