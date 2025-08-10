import { useCallback, useMemo } from 'react';
import TextFormatter from '@/utils/textFormatter';

/**
 * React hook for text formatting with memoization
 */
export function useTextFormatter() {
  // Memoized formatting functions
  const formatTitle = useCallback((text: string) => {
    return TextFormatter.formatTitle(text);
  }, []);

  const formatDescription = useCallback((text: string) => {
    return TextFormatter.formatDescription(text);
  }, []);

  const formatSentence = useCallback((text: string) => {
    return TextFormatter.formatSentence(text);
  }, []);

  const formatListItem = useCallback((text: string) => {
    return TextFormatter.formatListItem(text);
  }, []);

  const formatUIText = useCallback((text: string, type: 'title' | 'description' | 'label' | 'button' | 'link' = 'description') => {
    return TextFormatter.formatUIText(text, type);
  }, []);

  const formatNumbers = useCallback((text: string) => {
    return TextFormatter.formatNumbers(text);
  }, []);

  const formatTechnicalTerms = useCallback((text: string) => {
    return TextFormatter.formatTechnicalTerms(text);
  }, []);

  // Return all formatting functions
  return useMemo(() => ({
    formatTitle,
    formatDescription,
    formatSentence,
    formatListItem,
    formatUIText,
    formatNumbers,
    formatTechnicalTerms,
    format: TextFormatter.format
  }), [
    formatTitle,
    formatDescription,
    formatSentence,
    formatListItem,
    formatUIText,
    formatNumbers,
    formatTechnicalTerms
  ]);
}

/**
 * Hook to format text with automatic re-formatting when text changes
 */
export function useFormattedText(text: string, type: 'title' | 'description' | 'label' | 'button' | 'link' = 'description') {
  return useMemo(() => {
    if (!text || typeof text !== 'string') return text || '';
    try {
      return TextFormatter.formatUIText(text, type);
    } catch (error) {
      console.warn('Text formatting error:', error);
      return text;
    }
  }, [text, type]);
}

/**
 * Hook to format multiple texts at once
 */
export function useFormattedTexts<T extends Record<string, string>>(
  texts: T,
  types: Partial<Record<keyof T, 'title' | 'description' | 'label' | 'button' | 'link'>> = {}
): T {
  return useMemo(() => {
    const formatted = {} as T;
    
    Object.entries(texts).forEach(([key, text]) => {
      const type = types[key as keyof T] || 'description';
      formatted[key as keyof T] = TextFormatter.formatUIText(text as string, type) as T[keyof T];
    });
    
    return formatted;
  }, [texts, types]);
}
