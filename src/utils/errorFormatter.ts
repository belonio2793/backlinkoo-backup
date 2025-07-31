/**
 * Error Formatting Utility
 * Properly formats error objects for display to users
 */

export interface FormattedError {
  message: string;
  details?: string;
  type: 'database' | 'network' | 'validation' | 'configuration' | 'unknown';
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Format any error object into a user-friendly message
 */
export function formatError(error: any): FormattedError {
  if (!error) {
    return {
      message: 'Unknown error occurred',
      type: 'unknown',
      severity: 'medium'
    };
  }

  // Handle string errors
  if (typeof error === 'string') {
    return {
      message: error,
      type: 'unknown',
      severity: 'medium'
    };
  }

  // Handle Supabase errors
  if (error.message || error.details || error.hint) {
    const message = error.message || 'Database operation failed';
    const details = [
      error.details && `Details: ${error.details}`,
      error.hint && `Hint: ${error.hint}`,
      error.code && `Code: ${error.code}`
    ].filter(Boolean).join(' | ');

    // Detect specific error types
    let type: FormattedError['type'] = 'database';
    let severity: FormattedError['severity'] = 'medium';

    if (message.includes('not available') || message.includes('configure')) {
      type = 'configuration';
      severity = 'high';
    } else if (message.includes('network') || message.includes('connection')) {
      type = 'network';
      severity = 'high';
    } else if (message.includes('validation') || message.includes('invalid')) {
      type = 'validation';
      severity = 'medium';
    }

    return {
      message,
      details: details || undefined,
      type,
      severity
    };
  }

  // Handle network/fetch errors
  if (error instanceof Error) {
    let type: FormattedError['type'] = 'network';
    let severity: FormattedError['severity'] = 'medium';

    if (error.message.includes('fetch')) {
      type = 'network';
      severity = 'high';
    }

    return {
      message: error.message,
      type,
      severity
    };
  }

  // Handle objects with custom error structures
  if (typeof error === 'object') {
    // Try to extract meaningful information
    const possibleMessages = [
      error.error?.message,
      error.message,
      error.details,
      error.description,
      error.toString?.()
    ].filter(Boolean);

    const message = possibleMessages[0] || 'Unknown error occurred';

    return {
      message: typeof message === 'string' ? message : JSON.stringify(message),
      details: possibleMessages.length > 1 ? possibleMessages.slice(1).join(' | ') : undefined,
      type: 'unknown',
      severity: 'medium'
    };
  }

  // Fallback for any other type
  return {
    message: String(error),
    type: 'unknown',
    severity: 'medium'
  };
}

/**
 * Get a user-friendly error message from any error
 */
export function getErrorMessage(error: any): string {
  const formatted = formatError(error);
  return formatted.details ? `${formatted.message} (${formatted.details})` : formatted.message;
}

/**
 * Check if an error indicates missing configuration
 */
export function isConfigurationError(error: any): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('configure') || 
         message.includes('not available') || 
         message.includes('missing') ||
         message.includes('not set') ||
         message.includes('mock mode');
}

/**
 * Check if an error indicates database connectivity issues
 */
export function isDatabaseError(error: any): boolean {
  const message = getErrorMessage(error).toLowerCase();
  return message.includes('database') || 
         message.includes('supabase') || 
         message.includes('connection') ||
         message.includes('table');
}

/**
 * Get a helpful solution message for common errors
 */
export function getErrorSolution(error: any): string {
  const formatted = formatError(error);
  
  if (isConfigurationError(error)) {
    return 'Check your environment variables configuration in the admin dashboard.';
  }
  
  if (isDatabaseError(error)) {
    return 'Verify your Supabase connection settings and ensure the database is accessible.';
  }
  
  switch (formatted.type) {
    case 'network':
      return 'Check your internet connection and try again.';
    case 'validation':
      return 'Please verify your input data and try again.';
    case 'configuration':
      return 'Check your system configuration settings.';
    default:
      return 'Please try again or contact support if the problem persists.';
  }
}
