/**
 * Date utilities for safe date handling in campaign components
 * Prevents getTime() errors when dates are strings or invalid
 */

/**
 * Safely calculates runtime in minutes from a date string or Date object
 */
export function safeGetRuntimeMinutes(dateValue: string | Date | null | undefined): number {
  if (!dateValue) return 0;
  
  try {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return 0;
    
    return Math.round((Date.now() - date.getTime()) / (1000 * 60));
  } catch {
    return 0;
  }
}

/**
 * Safely calculates runtime in hours from a date string or Date object
 */
export function safeGetRuntimeHours(dateValue: string | Date | null | undefined): number {
  if (!dateValue) return 0;
  
  try {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return 0;
    
    return Math.round((Date.now() - date.getTime()) / (1000 * 60 * 60));
  } catch {
    return 0;
  }
}

/**
 * Safely formats a date for display
 */
export function safeFormatDate(dateValue: string | Date | null | undefined, options?: Intl.DateTimeFormatOptions): string {
  if (!dateValue) return 'Recently';
  
  try {
    const date = dateValue instanceof Date ? dateValue : new Date(dateValue);
    if (isNaN(date.getTime())) return 'Recently';
    
    return date.toLocaleDateString(undefined, options);
  } catch {
    return 'Recently';
  }
}

/**
 * Safely converts a date value to a Date object
 */
export function safeToDate(dateValue: string | Date | null | undefined): Date | null {
  if (!dateValue) return null;
  
  try {
    if (dateValue instanceof Date) {
      return isNaN(dateValue.getTime()) ? null : dateValue;
    }
    
    const date = new Date(dateValue);
    return isNaN(date.getTime()) ? null : date;
  } catch {
    return null;
  }
}

/**
 * Safely gets timestamp for sorting
 */
export function safeGetTimestamp(dateValue: string | Date | null | undefined): number {
  const date = safeToDate(dateValue);
  return date ? date.getTime() : Date.now();
}
