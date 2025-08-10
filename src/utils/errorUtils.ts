/**
 * Error utilities to handle proper error formatting and response body reading
 * Fixes "[object Object]" displays and "body stream already read" errors
 */

/**
 * Safely formats an error for display in UI components
 * Prevents "[object Object]" by properly stringifying error objects
 */
export function formatErrorForUI(error: any): string {
  if (!error) {
    return 'An unknown error occurred';
  }

  // If it's already a string, return it
  if (typeof error === 'string') {
    return error;
  }

  // If it's an Error object, use the message
  if (error instanceof Error) {
    return error.message || error.toString();
  }

  // If it's a Supabase-style error object
  if (error && typeof error === 'object') {
    if (error.message) {
      return String(error.message);
    }
    if (error.error && error.error.message) {
      return String(error.error.message);
    }
    if (error.details) {
      return String(error.details);
    }
    // If it has multiple fields, create a readable string
    if (error.code || error.hint) {
      let message = '';
      if (error.message) message += String(error.message);
      if (error.code) message += ` (Code: ${error.code})`;
      if (error.hint) message += ` Hint: ${error.hint}`;
      return message || 'Database error occurred';
    }
  }

  // Last resort: try to stringify it safely
  try {
    const stringified = JSON.stringify(error);
    if (stringified && stringified !== '{}' && stringified !== 'null') {
      return stringified;
    }
  } catch {
    // Fall through to default
  }

  // Final fallback: use toString but check if it returns [object Object]
  const stringResult = String(error);
  if (stringResult === '[object Object]') {
    return 'An error occurred (details unavailable)';
  }

  return stringResult;
}

/**
 * Safely reads a response body only once to avoid "body stream already read" errors
 * Returns both text and parsed JSON if possible
 */
export async function safeReadResponse(response: Response): Promise<{
  text: string;
  json: any | null;
  success: boolean;
}> {
  try {
    // Clone the response so we can read it multiple times if needed
    const clonedResponse = response.clone();
    
    // First try to get the text
    let text = '';
    try {
      text = await clonedResponse.text();
    } catch (textError) {
      console.warn('Failed to read response as text:', textError);
      return {
        text: '',
        json: null,
        success: false
      };
    }

    // Try to parse as JSON if we have text
    let json = null;
    if (text) {
      try {
        json = JSON.parse(text);
      } catch (jsonError) {
        // Not JSON, that's fine
      }
    }

    return {
      text,
      json,
      success: true
    };
  } catch (error) {
    console.warn('Failed to safely read response:', error);
    return {
      text: '',
      json: null,
      success: false
    };
  }
}

/**
 * Safely formats error for logging with proper structure
 * Prevents "[object Object]" in console logs
 */
export function formatErrorForLogging(error: any, context?: string): any {
  const logEntry: any = {};

  if (context) {
    logEntry.context = context;
  }

  if (!error) {
    return { ...logEntry, error: 'Unknown error' };
  }

  // Handle different error types
  if (error instanceof Error) {
    logEntry.error = {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: (error as any).code
    };
  } else if (typeof error === 'object') {
    // Handle Supabase-style errors and other objects
    logEntry.error = {
      message: error.message,
      code: error.code,
      details: error.details,
      hint: error.hint,
      // Include other properties but filter out functions and circular references
      ...Object.fromEntries(
        Object.entries(error).filter(([key, value]) => 
          typeof value !== 'function' && 
          typeof value !== 'undefined'
        )
      )
    };
  } else {
    logEntry.error = String(error);
  }

  return logEntry;
}

/**
 * Enhanced error handling for fetch responses
 * Handles both successful and error responses safely
 */
export async function handleFetchResponse<T = any>(
  response: Response,
  context?: string
): Promise<{ success: boolean; data?: T; error?: string }> {
  try {
    const { text, json, success: readSuccess } = await safeReadResponse(response);
    
    if (!readSuccess) {
      return {
        success: false,
        error: `Failed to read response ${context ? `for ${context}` : ''}`
      };
    }

    if (response.ok) {
      return {
        success: true,
        data: json || text
      };
    } else {
      // Handle error responses
      let errorMessage = `HTTP ${response.status}: ${response.statusText}`;
      
      if (json && json.error) {
        errorMessage = formatErrorForUI(json.error);
      } else if (json && json.message) {
        errorMessage = json.message;
      } else if (text) {
        errorMessage = text;
      }

      return {
        success: false,
        error: errorMessage
      };
    }
  } catch (error) {
    const formattedError = formatErrorForLogging(error, context);
    console.error('Fetch response handling error:', formattedError);
    
    return {
      success: false,
      error: formatErrorForUI(error)
    };
  }
}
