/**
 * Test script to verify error logging fixes
 * This will help us confirm the "[object Object]" error is resolved
 */

// Simulate the old problematic pattern
console.log('=== Testing Old Pattern (Problematic) ===');
const testError = new Error('Test error message');
testError.code = 'TEST_CODE';
testError.details = 'Test error details';

console.error('Old pattern (bad):', testError);

// Simulate the new fixed pattern
console.log('\n=== Testing New Pattern (Fixed) ===');
console.error('New pattern (good):', {
  message: testError.message,
  code: testError.code,
  details: testError.details,
  stack: testError.stack,
  name: testError.name
});

// Test with typical Supabase error structure
console.log('\n=== Testing with Supabase-like Error ===');
const supabaseError = {
  message: 'relation "campaign_metrics" does not exist',
  code: '42P01',
  details: null,
  hint: 'Perhaps you meant to reference the table "public"."campaigns"?'
};

console.error('Supabase error (old way):', supabaseError);
console.error('Supabase error (new way):', {
  message: supabaseError.message,
  code: supabaseError.code,
  details: supabaseError.details,
  hint: supabaseError.hint
});

console.log('\n✅ If you see meaningful error details above (not "[object Object]"), the fix is working!');
