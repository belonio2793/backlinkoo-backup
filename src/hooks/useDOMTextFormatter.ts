import { useEffect, useRef } from 'react';
import DOMTextFormatter from '@/utils/domTextFormatter';

/**
 * Hook to automatically format text content in a component
 */
export function useDOMTextFormatter(
  enabled: boolean = true,
  autoFormat: boolean = true,
  watchChanges: boolean = true
) {
  const containerRef = useRef<HTMLDivElement>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    if (!enabled || !containerRef.current) return;

    // Initial formatting
    if (autoFormat) {
      const result = DOMTextFormatter.formatAll(containerRef.current);
      console.log('🎨 Text formatting applied:', result);
    }

    // Set up automatic formatting for dynamic content
    if (watchChanges) {
      observerRef.current = DOMTextFormatter.setupAutoFormatting(containerRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
        observerRef.current = null;
      }
    };
  }, [enabled, autoFormat, watchChanges]);

  // Manual format function
  const formatNow = () => {
    if (containerRef.current) {
      return DOMTextFormatter.formatAll(containerRef.current);
    }
    return { total: 0, cards: 0, forms: 0, general: 0 };
  };

  return {
    containerRef,
    formatNow
  };
}

/**
 * Hook for formatting specific content types
 */
export function useContentFormatter() {
  const formatText = (text: string, type: 'title' | 'description' | 'label' | 'button' | 'link' = 'description') => {
    // This is handled by the TextFormatter utility
    return text; // The actual formatting is done in components using FormattedText
  };

  return { formatText };
}

/**
 * Hook to format text on component mount
 */
export function useAutoFormat(delay: number = 1000) {
  useEffect(() => {
    const timer = setTimeout(() => {
      const result = DOMTextFormatter.formatAll();
      if (result.total > 0) {
        console.log('🎨 Auto-formatted text elements on page:', result);
      }
    }, delay);

    return () => clearTimeout(timer);
  }, [delay]);
}
