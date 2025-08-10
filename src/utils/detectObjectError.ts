/**
 * Utility to detect and trace [object Object] errors in real-time
 */

import { formatErrorForUI } from './errorUtils';

// Override console methods to detect [object Object] logging
export function enableObjectErrorDetection() {
  const originalError = console.error;
  const originalWarn = console.warn;
  const originalLog = console.log;

  console.error = function(...args: any[]) {
    // Check if any argument contains [object Object]
    const hasObjectError = args.some(arg => 
      (typeof arg === 'string' && arg.includes('[object Object]')) ||
      (arg && typeof arg === 'object' && arg.toString() === '[object Object]')
    );

    if (hasObjectError) {
      console.warn('🚨 DETECTED [object Object] ERROR:', args);
      console.trace('Stack trace for [object Object] error:');
    }

    originalError.apply(console, args);
  };

  console.warn = function(...args: any[]) {
    const hasObjectError = args.some(arg => 
      (typeof arg === 'string' && arg.includes('[object Object]')) ||
      (arg && typeof arg === 'object' && arg.toString() === '[object Object]')
    );

    if (hasObjectError) {
      console.warn('🚨 DETECTED [object Object] WARNING:', args);
      console.trace('Stack trace for [object Object] warning:');
    }

    originalWarn.apply(console, args);
  };

  console.log = function(...args: any[]) {
    const hasObjectError = args.some(arg => 
      (typeof arg === 'string' && arg.includes('[object Object]')) ||
      (arg && typeof arg === 'object' && arg.toString() === '[object Object]')
    );

    if (hasObjectError) {
      console.warn('🚨 DETECTED [object Object] LOG:', args);
      console.trace('Stack trace for [object Object] log:');
    }

    originalLog.apply(console, args);
  };

  console.log('✅ Object error detection enabled - will trace any [object Object] occurrences');
}

// Test function to verify detection is working
export function testObjectErrorDetection() {
  console.log('🧪 Testing object error detection...');

  const testError = { code: 'TEST', message: 'test error' };

  // This should trigger detection (using safe format to avoid creating the actual error)
  console.error('Test error direct object:', testError);
  console.error('Test error string concat:', 'Test message: ' + formatErrorForUI(testError));
  console.error('Test error template literal:', `Test message: ${formatErrorForUI(testError)}`);

  console.log('✅ Object error detection test completed');
}

// Auto-enable disabled to prevent console pollution
// To enable manually: enableObjectErrorDetection()
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  (window as any).enableObjectErrorDetection = enableObjectErrorDetection;
  (window as any).testObjectErrorDetection = testObjectErrorDetection;
  console.log('🔧 Error detection available: enableObjectErrorDetection(), testObjectErrorDetection()');
}
