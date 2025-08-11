/**
 * React hook to ensure proper text spacing
 */

import { useMemo } from 'react';

export function useTextSpacing(text: string): string {
  return useMemo(() => {
    if (!text) return text;
    
    let fixedText = text;
    
    // Fix common concatenation patterns
    fixedText = fixedText.replace(/("[\w\s]+")([a-z])/gi, '$1 $2');
    fixedText = fixedText.replace(/([a-z])(in\d+[hm])/gi, '$1 $2');
    fixedText = fixedText.replace(/(\d+[hm])(\d+[hm])/gi, '$1 $2');
    fixedText = fixedText.replace(/(\d+[hm])(remaining)/gi, '$1 $2');
    fixedText = fixedText.replace(/(remaining)([a-z])/gi, '$1 $2');
    fixedText = fixedText.replace(/(automatically)(deleted?)/gi, '$1 $2');
    fixedText = fixedText.replace(/(deleted?)(in)/gi, '$1 $2');
    
    // Ensure spaces around quotes
    fixedText = fixedText.replace(/"([^"]+)"will/gi, '"$1" will');
    
    // Ensure spaces around time
    fixedText = fixedText.replace(/in(\d+h)/gi, 'in $1');
    
    return fixedText;
  }, [text]);
}

export function useSpacedText(text: string): string {
  return useTextSpacing(text);
}
