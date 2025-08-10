/**
 * Final test to verify all [object Object] errors are fixed
 */

import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';

export async function runFinalObjectErrorCheck(): Promise<{
  success: boolean;
  issues: string[];
}> {
  console.log('🔍 Final [object Object] Error Check...\n');

  const issues: string[] = [];

  // Test 1: Error object stringification in template literals
  console.log('Test 1: Template literal safety');
  const testError = { code: 'TEST', message: 'test error' };
  
  const templateTest = `Error occurred: ${formatErrorForUI(testError)}`;
  if (templateTest.includes('[object Object]')) {
    issues.push('Template literal with formatErrorForUI produces [object Object]');
  }

  // Test 2: Console logging safety
  console.log('Test 2: Console logging safety');
  const originalError = console.error;
  let consoleOutput = '';
  
  console.error = (...args) => {
    consoleOutput = args.join(' ');
  };
  
  console.error('Failed to fetch campaign metrics:', formatErrorForLogging(testError, 'test'));
  
  if (consoleOutput.includes('[object Object]')) {
    issues.push('Console logging produces [object Object]');
  }
  
  console.error = originalError;

  // Test 3: Service error return format
  console.log('Test 3: Service error return format');
  const serviceResult = {
    success: false,
    error: formatErrorForUI(testError)
  };
  
  if (serviceResult.error === '[object Object]') {
    issues.push('Service error formatting produces [object Object]');
  }

  // Test 4: Common error scenarios
  console.log('Test 4: Common error scenarios');
  const commonErrors = [
    new Error('Database connection failed'),
    { message: 'Permission denied', code: '42501' },
    'String error',
    null,
    undefined,
    {}
  ];

  commonErrors.forEach((error, index) => {
    const formatted = formatErrorForUI(error);
    if (formatted === '[object Object]') {
      issues.push(`Common error scenario ${index + 1} produces [object Object]`);
    }
  });

  const success = issues.length === 0;
  
  console.log(`\n${success ? '✅ ALL TESTS PASSED' : '❌ ISSUES FOUND'}:`);
  if (issues.length > 0) {
    issues.forEach(issue => console.log(`  - ${issue}`));
  } else {
    console.log('  No [object Object] errors detected');
  }

  return { success, issues };
}

// Auto-run disabled to prevent console pollution
// To run manually: runFinalObjectErrorCheck()
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  (window as any).runFinalObjectErrorCheck = runFinalObjectErrorCheck;
  console.log('🔧 Final error check available: runFinalObjectErrorCheck()');
}
