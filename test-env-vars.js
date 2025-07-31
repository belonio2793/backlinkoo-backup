// Environment Variable Diagnostic Script
console.log('=== Environment Variable Check ===');

// Check Vite environment variables (browser accessible)
console.log('\n🌐 VITE Environment Variables (Client-side):');
console.log('VITE_SUPABASE_URL:', import.meta?.env?.VITE_SUPABASE_URL || 'NOT SET');
console.log('VITE_SUPABASE_ANON_KEY:', import.meta?.env?.VITE_SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET');
console.log('VITE_OPENAI_API_KEY:', import.meta?.env?.VITE_OPENAI_API_KEY ? 'SET (hidden)' : 'NOT SET');

// Check Node.js environment variables (server-side)
console.log('\n🖥️  Node.js Environment Variables (Server-side):');
if (typeof process !== 'undefined') {
  console.log('OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('RESEND_API_KEY:', process.env.RESEND_API_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('SUPABASE_URL:', process.env.SUPABASE_URL ? 'SET (hidden)' : 'NOT SET');
} else {
  console.log('Process object not available (running in browser)');
}

// Check SecureConfig fallbacks
console.log('\n🔐 SecureConfig Fallbacks:');
try {
  const { SecureConfig } = await import('./src/lib/secure-config.ts');
  console.log('SecureConfig.SUPABASE_URL:', SecureConfig.SUPABASE_URL ? 'SET (hidden)' : 'NOT SET');
  console.log('SecureConfig.SUPABASE_ANON_KEY:', SecureConfig.SUPABASE_ANON_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('SecureConfig.RESEND_API_KEY:', SecureConfig.RESEND_API_KEY ? 'SET (hidden)' : 'NOT SET');
  console.log('SecureConfig.OPENAI_API_KEY:', SecureConfig.OPENAI_API_KEY ? 'SET (hidden)' : 'NOT SET');
} catch (error) {
  console.log('Error accessing SecureConfig:', error.message);
}
