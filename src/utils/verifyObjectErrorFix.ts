/**
 * Verification test to ensure [object Object] errors are eliminated
 */

import { formatErrorForUI } from './errorUtils';

export function verifyObjectErrorFix(): boolean {
  console.log('🔬 Running final [object Object] verification...');
  
  const testCases = [
    // Problematic objects that could cause [object Object]
    { toString: () => '[object Object]' },
    { },
    { code: 'ERROR', details: null },
    new Error(''),
    null,
    undefined,
    'already a string',
    42,
    true,
    { message: '' },
    { error: { message: '' } }
  ];
  
  let allPassed = true;
  
  testCases.forEach((testCase, index) => {
    const result = formatErrorForUI(testCase);
    
    if (result === '[object Object]') {
      console.error(`❌ Test ${index + 1} FAILED: formatErrorForUI returned [object Object] for:`, testCase);
      allPassed = false;
    } else {
      console.log(`✅ Test ${index + 1} passed: "${result}"`);
    }
  });
  
  // Test string concatenation patterns
  const concatTest1 = 'Failed to fetch campaign metrics: ' + formatErrorForUI({ toString: () => '[object Object]' });
  const concatTest2 = `Error: ${formatErrorForUI({ toString: () => '[object Object]' })}`;
  
  if (concatTest1.includes('[object Object]') || concatTest2.includes('[object Object]')) {
    console.error('❌ String concatenation still produces [object Object]');
    allPassed = false;
  } else {
    console.log('✅ String concatenation tests passed');
  }
  
  if (allPassed) {
    console.log('🎉 ALL TESTS PASSED! [object Object] errors are eliminated.');
  } else {
    console.error('❌ Some tests failed. [object Object] errors may still occur.');
  }
  
  return allPassed;
}

// Auto-run disabled to prevent console pollution
// To run manually: verifyObjectErrorFix()
if (typeof window !== 'undefined' && import.meta.env.DEV) {
  (window as any).verifyObjectErrorFix = verifyObjectErrorFix;
  console.log('🔧 Object error verification available: verifyObjectErrorFix()');
}
