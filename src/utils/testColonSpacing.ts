/**
 * Test utility to verify colon spacing fixes are working correctly
 */

import { ensureColonSpacing, formatTimeDisplay } from './colonSpacingFix';

export function testColonSpacingFixes() {
  console.log('🔍 Testing Colon Spacing Fixes...\n');

  // Test cases that should be fixed
  const testCases = [
    'Last update:8:36:29 PM',
    'System Ready:Your automated platform',
    'Status:Active',
    'Time:12:34:56',
    'Name:John Doe',
    'Value:100',
    'Data:Loading...',
    'Already correct: text',
    'Multiple:colons:in:text',
  ];

  console.log('Testing ensureColonSpacing function:');
  testCases.forEach((testCase, index) => {
    const fixed = ensureColonSpacing(testCase);
    const wasFixed = testCase !== fixed;
    console.log(`${index + 1}. "${testCase}" → "${fixed}" ${wasFixed ? '✅ FIXED' : '✓ OK'}`);
  });

  console.log('\nTesting formatTimeDisplay function:');
  const now = new Date();
  const formattedTime = formatTimeDisplay('Last update', now);
  console.log(`Time format: "${formattedTime}"`);
  
  // Check that there's proper spacing
  const hasProperSpacing = formattedTime.includes(': ') && !formattedTime.includes(':') || formattedTime.match(/:\s/);
  console.log(`Proper spacing: ${hasProperSpacing ? '✅ YES' : '❌ NO'}`);

  console.log('\n✅ Colon spacing test completed');
  
  // Return results for programmatic testing
  return {
    testCases: testCases.map(testCase => ({
      original: testCase,
      fixed: ensureColonSpacing(testCase),
      wasFixed: testCase !== ensureColonSpacing(testCase)
    })),
    timeFormatTest: {
      formatted: formattedTime,
      hasProperSpacing
    }
  };
}

// Auto-run in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setTimeout(() => {
    testColonSpacingFixes();
  }, 3000);
}
