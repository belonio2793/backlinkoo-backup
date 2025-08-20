/**
 * Test to verify blog migration error fix
 * This tests that error objects are properly formatted instead of showing "[object Object]"
 */

import { getErrorMessage, formatErrorForLogging } from './errorUtils';

export function testBlogMigrationErrorFix(): void {
  console.log('🧪 Testing blog migration error fix...');
  
  // Test various error types that could occur during migration
  const testErrors = [
    // Supabase error object
    {
      message: 'relation "blog_posts" does not exist',
      details: 'Table not found in database',
      hint: null,
      code: '42P01'
    },
    // Network error
    new Error('Failed to fetch'),
    // String error
    'Connection timeout',
    // Null/undefined
    null,
    undefined,
    // Complex object without message
    { code: 500, status: 'error', data: { reason: 'Database unavailable' } },
    // Empty object
    {},
    // Error object that would normally show as [object Object]
    { toString: () => '[object Object]' }
  ];

  console.log('📋 Testing error formatting:');
  
  testErrors.forEach((error, index) => {
    const formatted = getErrorMessage(error);
    const isObjectObject = formatted === '[object Object]';
    
    console.log(`  ${index + 1}. Error type: ${typeof error}`);
    console.log(`     Original:`, error);
    console.log(`     Formatted: "${formatted}"`);
    console.log(`     Has [object Object]: ${isObjectObject ? '❌' : '✅'}`);
    console.log('');
  });

  // Test the logging function too
  console.log('📋 Testing error logging function:');
  
  testErrors.forEach((error, index) => {
    const logFormatted = formatErrorForLogging(error, 'Blog Migration Test');
    const isObjectObject = logFormatted.includes('[object Object]');
    
    console.log(`  ${index + 1}. Log formatted: "${logFormatted}"`);
    console.log(`     Contains [object Object]: ${isObjectObject ? '❌' : '✅'}`);
    console.log('');
  });

  // Simulate the exact error message pattern from migration
  console.log('🔍 Testing migration-specific error pattern:');
  
  const migrationError = {
    message: 'permission denied for table blog_posts',
    details: 'Insufficient privileges',
    hint: 'You might need to grant permissions',
    code: '42501'
  };

  const migrationFormatted = getErrorMessage(migrationError);
  console.log('Migration error formatted:', migrationFormatted);
  console.log('Would show as [object Object]:', migrationFormatted === '[object Object]' ? '❌ YES' : '✅ NO');

  console.log('✅ Blog migration error fix test complete!');
}

// Auto-run test in development
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  // Run after a delay to not interfere with app startup
  setTimeout(() => {
    testBlogMigrationErrorFix();
  }, 2000);
}
