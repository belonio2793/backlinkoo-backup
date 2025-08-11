import { useCallback, useRef, useEffect } from 'react';
import { useToast } from '@/hooks/use-toast';

/**
 * Hook for safe async operations that prevents promise rejections
 * when components unmount during async operations
 */
export function useAsyncSafeOperation() {
  const { toast } = useToast();
  const isMountedRef = useRef(true);
  const activeOperationsRef = useRef(new Set<Promise<any>>());

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      // Cancel or ignore any pending operations
      activeOperationsRef.current.clear();
    };
  }, []);

  /**
   * Wraps an async operation to make it safe from promise rejections
   * after component unmount
   */
  const safeAsync = useCallback(async <T>(
    operation: () => Promise<T>,
    options: {
      onError?: (error: any) => void;
      errorMessage?: string;
      showToast?: boolean;
      logError?: boolean;
    } = {}
  ): Promise<T | null> => {
    const {
      onError,
      errorMessage = 'An unexpected error occurred',
      showToast = false,
      logError = true
    } = options;

    if (!isMountedRef.current) {
      console.warn('Attempted to run async operation on unmounted component');
      return null;
    }

    try {
      const promise = operation();
      activeOperationsRef.current.add(promise);

      const result = await promise;
      
      // Remove from active operations when done
      activeOperationsRef.current.delete(promise);
      
      // Only proceed if component is still mounted
      if (!isMountedRef.current) {
        console.warn('Async operation completed after component unmount, result ignored');
        return null;
      }

      return result;
    } catch (error: any) {
      // Remove from active operations on error
      activeOperationsRef.current.forEach(promise => {
        if (promise) activeOperationsRef.current.delete(promise);
      });

      // Only handle error if component is still mounted
      if (!isMountedRef.current) {
        console.warn('Async operation failed after component unmount, error ignored');
        return null;
      }

      if (logError) {
        console.error('Safe async operation failed:', {
          error: error?.message || error,
          stack: error?.stack,
          timestamp: new Date().toISOString()
        });
      }

      if (onError) {
        onError(error);
      }

      if (showToast) {
        toast({
          title: "Error",
          description: errorMessage,
          variant: "destructive"
        });
      }

      return null;
    }
  }, [toast]);

  /**
   * Check if component is still mounted
   */
  const isMounted = useCallback(() => isMountedRef.current, []);

  /**
   * Safely set state only if component is mounted
   */
  const safeSetState = useCallback(<T>(
    setter: (value: T) => void,
    value: T
  ) => {
    if (isMountedRef.current) {
      setter(value);
    }
  }, []);

  return {
    safeAsync,
    isMounted,
    safeSetState
  };
}
