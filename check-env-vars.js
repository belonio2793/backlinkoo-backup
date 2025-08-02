// Check environment variables for user creation
console.log('🔍 Environment Variables Check:');
console.log('====================================');

const requiredVars = [
  'VITE_SUPABASE_URL',
  'VITE_SUPABASE_ANON_KEY', 
  'SUPABASE_SERVICE_ROLE_KEY'
];

requiredVars.forEach(varName => {
  const value = process.env[varName];
  if (value) {
    console.log(`✅ ${varName}: ${value.substring(0, 20)}...`);
  } else {
    console.log(`❌ ${varName}: MISSING`);
  }
});

console.log('\n📋 Status Summary:');
console.log('====================================');

if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.log('❌ CRITICAL: SUPABASE_SERVICE_ROLE_KEY is missing!');
  console.log('');
  console.log('This is why user creation is failing. You need to:');
  console.log('1. Get your Service Role Key from Supabase Dashboard');
  console.log('2. Add it to your environment variables');
  console.log('3. Either add to .env file or Netlify environment settings');
  console.log('');
  console.log('To get the Service Role Key:');
  console.log('- Go to your Supabase project dashboard');
  console.log('- Navigate to Settings > API');
  console.log('- Copy the "service_role" key (not the anon key)');
  console.log('- This key bypasses Row Level Security for admin operations');
} else {
  console.log('✅ All required environment variables are present');
}
