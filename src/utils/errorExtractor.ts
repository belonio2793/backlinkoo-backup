/**
 * Utility to extract readable error messages from complex error objects
 */

export function extractErrorMessage(error: any): string {
  if (!error) return 'Unknown error';
  
  // If it's already a string, return it
  if (typeof error === 'string') return error;
  
  // Try different error message properties
  if (error.message) return error.message;
  if (error.error_description) return error.error_description;
  if (error.description) return error.description;
  if (error.details) return error.details;
  if (error.hint) return error.hint;
  
  // For Supabase errors, try these specific properties
  if (error.code) {
    let msg = `Error ${error.code}`;
    if (error.message) msg += `: ${error.message}`;
    if (error.details) msg += ` (${error.details})`;
    if (error.hint) msg += ` Hint: ${error.hint}`;
    return msg;
  }
  
  // If it's an object, try to extract useful information
  if (typeof error === 'object') {
    // Try to JSON stringify, but handle circular references
    try {
      return JSON.stringify(error, null, 2);
    } catch (stringifyError) {
      // If JSON.stringify fails, try to extract key properties
      const keys = Object.keys(error);
      if (keys.length > 0) {
        const keyValues = keys.slice(0, 5).map(key => {
          try {
            return `${key}: ${error[key]}`;
          } catch {
            return `${key}: [object]`;
          }
        });
        return `Object error: {${keyValues.join(', ')}}`;
      }
    }
  }
  
  // Last resort
  return String(error);
}

export function logError(context: string, error: any, additionalInfo?: any) {
  const errorMessage = extractErrorMessage(error);
  console.error(`❌ ${context}:`, errorMessage);
  
  if (additionalInfo) {
    console.error(`   Additional info:`, additionalInfo);
  }
  
  // Also log the raw error in development for debugging
  if (import.meta.env.DEV) {
    console.error(`   Raw error:`, error);
  }
}

export function logSupabaseError(context: string, error: any) {
  const errorMessage = extractErrorMessage(error);
  console.error(`❌ ${context}:`, errorMessage);
  
  // Check for common Supabase error patterns
  if (errorMessage.includes('No API key') || errorMessage.includes('Invalid API key')) {
    console.error('🔑 This appears to be an API key configuration issue');
    console.error('💡 Check VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY environment variables');
  }
  
  if (errorMessage.includes('permission denied') || errorMessage.includes('RLS')) {
    console.error('🔒 This appears to be a Row Level Security (RLS) policy issue');
    console.error('💡 Check RLS policies in your Supabase dashboard');
  }
  
  if (errorMessage.includes('relation') && errorMessage.includes('does not exist')) {
    console.error('📋 This appears to be a missing table issue');
    console.error('💡 Check if the table exists in your Supabase database');
  }
  
  // Log raw error in development
  if (import.meta.env.DEV) {
    console.error(`   Raw Supabase error:`, error);
  }
}
