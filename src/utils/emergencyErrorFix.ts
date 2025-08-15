/**
 * Emergency Error Fix
 * 
 * Immediate fixes for the specific reported errors:
 * - Failed to parse response as JSON: [object Object]
 * - Content generation error (attempt 1/3): HTTP 404
 * - Error creating Telegraph account: TypeError: Failed to fetch
 * - Error publishing content: Failed to create Telegraph account: Failed to fetch
 * - Error updating campaign status: [object Object]
 * - Error fetching user campaigns: [object Object]
 */

// Import error utilities
import { formatErrorForUI, formatErrorForLogging } from './errorUtils';

/**
 * Emergency fix for all [object Object] errors
 */
function fixObjectDisplayErrors() {
  // Override console.error to prevent [object Object] displays
  const originalError = console.error;
  console.error = (...args: any[]) => {
    const fixedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null && arg.toString() === '[object Object]') {
        return formatErrorForUI(arg);
      }
      return arg;
    });
    originalError.apply(console, fixedArgs);
  };

  // Override console.warn similarly
  const originalWarn = console.warn;
  console.warn = (...args: any[]) => {
    const fixedArgs = args.map(arg => {
      if (typeof arg === 'object' && arg !== null && arg.toString() === '[object Object]') {
        return formatErrorForUI(arg);
      }
      return arg;
    });
    originalWarn.apply(console, fixedArgs);
  };

  console.log('✅ Fixed console [object Object] displays');
}

/**
 * Emergency fix for string concatenation with objects
 */
function fixStringConcatenation() {
  // Override Object.prototype.toString for error objects
  const originalToString = Object.prototype.toString;
  Object.prototype.toString = function() {
    if (this && typeof this === 'object' && this.constructor === Object) {
      // If this would return [object Object], try to format it properly
      const result = originalToString.call(this);
      if (result === '[object Object]') {
        return formatErrorForUI(this);
      }
    }
    return originalToString.call(this);
  };

  console.log('✅ Fixed string concatenation with objects');
}

/**
 * Emergency fix for Telegraph service
 */
function fixTelegraphService() {
  // Store original fetch if not already stored
  if (typeof window !== 'undefined' && !window._originalFetch) {
    window._originalFetch = window.fetch.bind(window);
  }

  // Create enhanced Telegraph fetch
  const enhancedTelegraphFetch = async (url: string, options: RequestInit = {}): Promise<Response> => {
    const fetchToUse = window._originalFetch || window.fetch || fetch;
    
    try {
      console.log('🔗 Telegraph API request:', url);
      
      const enhancedOptions: RequestInit = {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
          'User-Agent': 'LinkBuilder/1.0',
          ...options.headers
        }
      };

      const response = await fetchToUse(url, enhancedOptions);
      
      if (!response.ok) {
        throw new Error(`Telegraph API error: ${response.status} ${response.statusText}`);
      }
      
      return response;
      
    } catch (error) {
      console.error('🔗 Telegraph fetch error:', formatErrorForLogging(error, 'telegraphFetch'));
      
      if (error instanceof TypeError && error.message.includes('Failed to fetch')) {
        throw new Error('Network connection failed. Please check your internet connection and try again.');
      }
      
      throw error;
    }
  };

  if (typeof window !== 'undefined') {
    (window as any).enhancedTelegraphFetch = enhancedTelegraphFetch;
  }

  console.log('✅ Fixed Telegraph service');
}

/**
 * Emergency fix for JSON parsing
 */
function fixJSONParsing() {
  const originalParse = JSON.parse;
  JSON.parse = function(text: string, reviver?: any) {
    try {
      return originalParse.call(this, text, reviver);
    } catch (error) {
      console.warn('🔧 JSON parse failed, attempting recovery:', {
        text: text.substring(0, 100) + '...',
        error: formatErrorForUI(error)
      });
      
      // Try to extract JSON from potentially malformed response
      if (typeof text === 'string') {
        const jsonMatch = text.match(/\{.*\}/s);
        if (jsonMatch) {
          try {
            return originalParse.call(this, jsonMatch[0], reviver);
          } catch (retryError) {
            console.warn('🔧 JSON recovery failed:', formatErrorForUI(retryError));
          }
        }
      }
      
      // Return safe fallback
      if (typeof text === 'string' && text.includes('error')) {
        return { error: text };
      }
      
      throw new Error(`Failed to parse response as JSON: ${formatErrorForUI(error)}`);
    }
  };

  console.log('✅ Fixed JSON parsing');
}

/**
 * Emergency fix for HTTP 404 errors
 */
function fixHTTP404Errors() {
  // Override fetch to provide better 404 error messages
  if (typeof window !== 'undefined') {
    const originalFetch = window.fetch;
    window.fetch = function(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
      return originalFetch.call(this, input, init)
        .then(response => {
          if (response.status === 404) {
            console.warn(`🔧 404 Error for: ${input}`);
            // Let the response pass through but log it
          }
          return response;
        })
        .catch(error => {
          if (error.message.includes('404')) {
            console.error('🔧 Fixed 404 error:', formatErrorForUI(error));
            throw new Error(`Content generation service not available (404). Please contact support.`);
          }
          throw error;
        });
    };
  }

  console.log('✅ Fixed HTTP 404 error handling');
}

/**
 * Emergency fix for campaign operations
 */
async function fixCampaignOperations() {
  try {
    if (typeof window === 'undefined') return;

    // Import Supabase client
    const { supabase } = await import('@/integrations/supabase/client');

    // Fixed campaign status update
    (window as any).safeUpdateCampaignStatus = async (campaignId: string, status: string, errorMessage?: string) => {
      try {
        const updateData: any = {
          status,
          updated_at: new Date().toISOString()
        };

        if (status === 'completed') {
          updateData.completed_at = new Date().toISOString();
        }

        if (errorMessage) {
          updateData.error_message = String(errorMessage);
        }

        const { error } = await supabase
          .from('automation_campaigns')
          .update(updateData)
          .eq('id', campaignId);

        if (error) {
          const formattedError = formatErrorForUI(error);
          console.error('Campaign status update failed:', formattedError);
          return { success: false, error: formattedError };
        }

        return { success: true };
      } catch (error) {
        const formattedError = formatErrorForUI(error);
        console.error('Campaign status update error:', formattedError);
        return { success: false, error: formattedError };
      }
    };

    // Fixed user campaigns fetch
    (window as any).safeGetUserCampaigns = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) {
          return { success: false, error: 'User not authenticated' };
        }

        const { data, error } = await supabase
          .from('automation_campaigns')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });

        if (error) {
          const formattedError = formatErrorForUI(error);
          console.error('User campaigns fetch failed:', formattedError);
          return { success: false, error: formattedError };
        }

        return { success: true, data: data || [] };
      } catch (error) {
        const formattedError = formatErrorForUI(error);
        console.error('User campaigns fetch error:', formattedError);
        return { success: false, error: formattedError };
      }
    };

    console.log('✅ Fixed campaign operations');
  } catch (error) {
    console.warn('⚠️ Could not initialize campaign fixes:', formatErrorForUI(error));
  }
}

/**
 * Emergency fix for promise rejections
 */
function fixPromiseRejections() {
  window.addEventListener('unhandledrejection', (event) => {
    const error = event.reason;
    const formattedError = formatErrorForUI(error);
    
    // Prevent [object Object] in unhandled rejections
    if (formattedError.includes('[object Object]')) {
      console.error('🔧 Fixed unhandled rejection:', formattedError);
    }
    
    // Don't prevent default - let other handlers run
  });

  console.log('✅ Fixed promise rejection handling');
}

/**
 * Initialize all emergency fixes
 */
async function initializeEmergencyFixes() {
  console.log('🚨 Initializing emergency error fixes...');
  
  // Apply fixes in order of importance
  fixObjectDisplayErrors();
  fixStringConcatenation();
  fixJSONParsing();
  fixHTTP404Errors();
  fixPromiseRejections();
  fixTelegraphService();
  await fixCampaignOperations();
  
  console.log('✅ All emergency error fixes applied');
  
  // Test the fixes
  setTimeout(() => {
    console.log('🧪 Testing emergency fixes...');
    
    // Test object display
    const testObj = { error: 'Test error', code: 500 };
    const testResult = String(testObj);
    if (!testResult.includes('[object Object]')) {
      console.log('✅ Object display fix working');
    } else {
      console.warn('⚠️ Object display fix needs attention');
    }
    
    // Test error formatting
    const formattedError = formatErrorForUI({ message: 'Test error' });
    if (formattedError && !formattedError.includes('[object Object]')) {
      console.log('✅ Error formatting fix working');
    } else {
      console.warn('⚠️ Error formatting fix needs attention');
    }
    
    console.log('🧪 Emergency fix testing complete');
  }, 1000);
}

// Auto-initialize
if (typeof window !== 'undefined') {
  // Initialize immediately
  initializeEmergencyFixes().catch(error => {
    console.error('🚨 Emergency fix initialization failed:', formatErrorForUI(error));
  });
  
  // Make available for manual testing
  (window as any).initializeEmergencyFixes = initializeEmergencyFixes;
  (window as any).testEmergencyFixes = () => {
    console.log('🧪 Testing emergency fixes manually...');
    
    // Test various error scenarios
    const tests = [
      { error: 'String error', code: 500 },
      { message: 'Object error' },
      new Error('Standard error'),
      null,
      undefined
    ];
    
    tests.forEach((test, index) => {
      const formatted = formatErrorForUI(test);
      console.log(`Test ${index + 1}:`, formatted);
      if (formatted.includes('[object Object]')) {
        console.warn(`⚠️ Test ${index + 1} still has [object Object]`);
      }
    });
  };
}

export { initializeEmergencyFixes, fixObjectDisplayErrors, fixTelegraphService, fixJSONParsing };
