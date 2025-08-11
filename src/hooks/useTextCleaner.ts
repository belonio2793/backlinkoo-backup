import { useEffect, useCallback, useRef } from 'react';
import { cleanText, cleanObject, globalAutoCleaner, hasProblematicrChars, getCleaningStats } from '@/utils/textCleaner';

/**
 * Hook for automatic text cleaning in React components
 */
export function useTextCleaner() {
  const cleanerRef = useRef(globalAutoCleaner);

  /**
   * Clean a string
   */
  const clean = useCallback((text: string) => {
    return cleanText(text);
  }, []);

  /**
   * Clean an object recursively
   */
  const cleanObj = useCallback(<T>(obj: T): T => {
    return cleanObject(obj);
  }, []);

  /**
   * Check if text has problematic characters
   */
  const hasProblems = useCallback((text: string) => {
    return hasProblematicrChars(text);
  }, []);

  /**
   * Get cleaning statistics
   */
  const getStats = useCallback((text: string) => {
    return getCleaningStats(text);
  }, []);

  /**
   * Start auto-cleaning
   */
  const startAutoCleaning = useCallback((intervalMs: number = 5000) => {
    cleanerRef.current.start(intervalMs);
  }, []);

  /**
   * Stop auto-cleaning
   */
  const stopAutoCleaning = useCallback(() => {
    cleanerRef.current.stop();
  }, []);

  /**
   * Check if auto-cleaning is running
   */
  const isAutoCleaningRunning = useCallback(() => {
    return cleanerRef.current.running;
  }, []);

  return {
    clean,
    cleanObj,
    hasProblems,
    getStats,
    startAutoCleaning,
    stopAutoCleaning,
    isAutoCleaningRunning
  };
}

/**
 * Hook that automatically cleans text on input change
 */
export function useAutoCleanInput(initialValue: string = '') {
  const { clean } = useTextCleaner();
  
  const cleanInput = useCallback((value: string) => {
    return clean(value);
  }, [clean]);

  return {
    cleanInput,
    // Helper for form inputs
    getCleanedValue: (event: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      return clean(event.target.value);
    }
  };
}

/**
 * Hook that automatically starts/stops the global auto-cleaner
 */
export function useGlobalAutoCleaner(enabled: boolean = true, intervalMs: number = 1000) {
  const { startAutoCleaning, stopAutoCleaning } = useTextCleaner();

  useEffect(() => {
    if (enabled) {
      startAutoCleaning(intervalMs);
    }

    return () => {
      if (enabled) {
        stopAutoCleaning();
      }
    };
  }, [enabled, intervalMs, startAutoCleaning, stopAutoCleaning]);
}
