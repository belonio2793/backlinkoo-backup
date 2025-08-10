/**
 * Debug utility to check current error state
 */

// Override console.error temporarily to catch any [object Object] errors
const originalConsoleError = console.error;
let errorFound = false;

console.error = function(...args: any[]) {
  const message = args.join(' ');
  if (message.includes('Failed to fetch campaign metrics: [object Object]')) {
    errorFound = true;
    console.log('🚨 FOUND THE ERROR! Source trace:');
    console.trace();
    console.log('Arguments:', args);
  }
  originalConsoleError.apply(console, args);
};

// Override console.warn too
const originalConsoleWarn = console.warn;

console.warn = function(...args: any[]) {
  const message = args.join(' ');
  if (message.includes('Failed to fetch campaign metrics: [object Object]')) {
    errorFound = true;
    console.log('🚨 FOUND THE ERROR IN WARNING! Source trace:');
    console.trace();
    console.log('Arguments:', args);
  }
  originalConsoleWarn.apply(console, args);
};

// Override console.log too just in case
const originalConsoleLog = console.log;

console.log = function(...args: any[]) {
  const message = args.join(' ');
  if (message.includes('Failed to fetch campaign metrics: [object Object]')) {
    errorFound = true;
    console.log('🚨 FOUND THE ERROR IN LOG! Source trace:');
    console.trace();
    console.log('Arguments:', args);
  }
  originalConsoleLog.apply(console, args);
};

// Restore original functions after 10 seconds
setTimeout(() => {
  console.error = originalConsoleError;
  console.warn = originalConsoleWarn;
  console.log = originalConsoleLog;
  
  if (!errorFound) {
    console.log('✅ No "[object Object]" errors detected in the last 10 seconds');
  }
}, 10000);

console.log('🔍 Error debugging active for 10 seconds...');
