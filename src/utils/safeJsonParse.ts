/**
 * Safe JSON parsing utility to handle problematic responses
 */

export interface SafeParseResult<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  rawData?: string;
}

/**
 * Safely parse JSON with enhanced error handling
 */
export function safeJsonParse<T = any>(text: unknown): SafeParseResult<T> {
  try {
    // Ensure input is a string
    let textStr: string;
    if (typeof text === 'string') {
      textStr = text;
    } else {
      console.warn('🔧 safeJsonParse: Converting non-string input to string:', typeof text);
      textStr = String(text);
    }

    // Check for empty input
    if (!textStr || textStr.trim() === '') {
      return {
        success: false,
        error: 'Empty input provided',
        rawData: textStr
      };
    }

    // Trim and validate basic JSON structure
    const trimmed = textStr.trim();
    if (!trimmed.startsWith('{') && !trimmed.startsWith('[')) {
      // Try to extract JSON from the response if it's embedded
      const jsonMatch = trimmed.match(/\{.*\}/s);
      if (jsonMatch) {
        try {
          const extracted = JSON.parse(jsonMatch[0]);
          return {
            success: true,
            data: extracted,
            rawData: textStr
          };
        } catch (extractError) {
          return {
            success: false,
            error: `Failed to parse extracted JSON: ${extractError instanceof Error ? extractError.message : String(extractError)}`,
            rawData: textStr
          };
        }
      }

      return {
        success: false,
        error: 'Input does not appear to be valid JSON',
        rawData: textStr
      };
    }

    // Parse JSON
    const parsed = JSON.parse(trimmed);
    return {
      success: true,
      data: parsed,
      rawData: textStr
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
      rawData: typeof text === 'string' ? text : String(text)
    };
  }
}

/**
 * Safe fetch with enhanced JSON parsing
 */
export async function safeFetchJson<T = any>(
  url: string, 
  options?: RequestInit
): Promise<SafeParseResult<T> & { status?: number; statusText?: string; headers?: Headers }> {
  try {
    const response = await fetch(url, options);
    
    // Get response text
    let responseText: string;
    try {
      responseText = await response.text();
    } catch (textError) {
      return {
        success: false,
        error: `Failed to read response: ${textError instanceof Error ? textError.message : String(textError)}`,
        status: response.status,
        statusText: response.statusText,
        headers: response.headers
      };
    }

    // Parse the response
    const parseResult = safeJsonParse<T>(responseText);

    return {
      ...parseResult,
      status: response.status,
      statusText: response.statusText,
      headers: response.headers
    };

  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Format error objects safely for display
 */
export function formatErrorSafely(error: unknown): string {
  if (error === null || error === undefined) {
    return 'Unknown error occurred';
  }

  if (typeof error === 'string') {
    return error;
  }

  if (error instanceof Error) {
    return error.message || 'Error occurred';
  }

  if (typeof error === 'object') {
    try {
      // Try to extract common error properties
      const errorObj = error as any;
      
      if (errorObj.message && typeof errorObj.message === 'string') {
        return errorObj.message;
      }
      
      if (errorObj.error && typeof errorObj.error === 'string') {
        return errorObj.error;
      }

      if (errorObj.details && typeof errorObj.details === 'string') {
        return errorObj.details;
      }

      // Safely stringify the object
      return JSON.stringify(error);
    } catch (stringifyError) {
      return 'Error object could not be formatted';
    }
  }

  return String(error);
}

export default safeJsonParse;
