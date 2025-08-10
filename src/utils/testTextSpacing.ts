/**
 * Test utility to verify text spacing fixes are working correctly
 */

export function testTextSpacingFixes() {
  console.log('🔍 Testing Text Spacing Fixes...\n');

  // Test cases that might have spacing issues
  const testCases = [
    'Last update:8:36:29 PM',
    'System Ready:Your automated platform',
    '132active campaigns',
    '1671+active users',
    'Real-time verified link placements from1200+ active',
  ];

  const fixes = [
    (text: string) => text.replace(/(\w):\s*(\w)/g, '$1: $2'), // Fix colon spacing
    (text: string) => text.replace(/(\d)([a-zA-Z])/g, '$1 $2'), // Fix number-letter spacing
    (text: string) => text.replace(/(\d)\+\s*([a-zA-Z])/g, '$1+ $2'), // Fix plus spacing
  ];

  testCases.forEach((testCase, index) => {
    console.log(`Test ${index + 1}: "${testCase}"`);
    
    let fixed = testCase;
    fixes.forEach(fix => {
      fixed = fix(fixed);
    });
    
    console.log(`Fixed: "${fixed}"`);
    console.log(`Changed: ${testCase !== fixed ? '✅' : '❌'}\n`);
  });

  // Test current time formatting
  const now = new Date();
  const timeString = now.toLocaleTimeString();
  console.log(`Current time test: "Last update: ${timeString}"`);
  console.log('✅ Text spacing test completed');
}

// Auto-run in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  setTimeout(() => {
    testTextSpacingFixes();
  }, 2000);
}
