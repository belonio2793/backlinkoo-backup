/**
 * React hook for text spacing - DISABLED
 * No autoformatting applied
 */

import { useMemo } from 'react';

export function useTextSpacing(text: string): string {
  return useMemo(() => {
    // Return text unchanged - no autoformatting
    return text;
  }, [text]);
}

export function useSpacedText(text: string): string {
  // Return text unchanged - no autoformatting
  return text;
}
