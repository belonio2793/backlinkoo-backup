/**
 * Quick test to verify current error handling state
 */
import { formatErrorForUI, formatErrorForLogging } from '@/utils/errorUtils';

export function runQuickErrorTest() {
  console.log('🔍 Quick Error Test - Current State Check\n');

  // Test different error types that could cause [object Object]
  const testCases = [
    { message: 'Permission denied', code: '42501' },
    new Error('Database connection failed'),
    'String error',
    null,
    undefined,
    {},
    { error: { message: 'Nested error' } }
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}:`);
    console.log('  Input:', testCase);
    
    const uiFormatted = formatErrorForUI(testCase);
    const logFormatted = formatErrorForLogging(testCase, 'test');
    
    console.log('  UI Formatted:', uiFormatted);
    console.log('  Log Formatted:', logFormatted);
    
    // Check for [object Object]
    if (uiFormatted === '[object Object]') {
      console.error('  ❌ UI formatting produces [object Object]');
    }
    
    if (JSON.stringify(logFormatted).includes('[object Object]')) {
      console.error('  ❌ Log formatting contains [object Object]');
    }
    
    // Test string concatenation (this is often where the issue occurs)
    const concatenated = 'Failed to fetch campaign metrics: ' + uiFormatted;
    if (concatenated.includes('[object Object]')) {
      console.error('  ❌ String concatenation produces [object Object]');
    }
    
    console.log('  Concatenation test:', concatenated);
    console.log('');
  });

  console.log('✅ Quick error test completed');
}

// Auto-run disabled to prevent error message pollution in console
// To run manually: runQuickErrorTest()
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  (window as any).runQuickErrorTest = runQuickErrorTest;
  console.log('🔧 Error test available: runQuickErrorTest()');
}
