// Emergency fix for "permission denied for table users" error
// This script applies an immediate fix to get your app working again

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const SUPABASE_URL = process.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = process.env.VITE_SUPABASE_ANON_KEY;

console.log('🚨 Emergency Permission Fix for RLS Policies');
console.log('==========================================');

if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
  console.error('❌ Missing Supabase credentials in environment variables');
  console.log('Required: VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function testAndFix() {
  console.log('🔍 Testing current profiles table access...');
  
  try {
    // Test if we can access profiles table
    const { data, error } = await supabase
      .from('profiles')
      .select('user_id')
      .limit(1);
    
    if (error) {
      console.log('❌ Current error:', error.message);
      
      if (error.message.includes('permission denied')) {
        console.log('🎯 Confirmed: RLS permission issue detected');
        console.log('');
        console.log('📋 MANUAL FIX REQUIRED:');
        console.log('1. Go to your Supabase dashboard');
        console.log('2. Navigate to SQL Editor');
        console.log('3. Run this SQL command:');
        console.log('');
        console.log('   ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('4. Test your app - it should work now');
        console.log('5. Then run this to re-enable with fixed policies:');
        console.log('');
        console.log('   -- Re-enable RLS');
        console.log('   ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;');
        console.log('');
        console.log('   -- Add simple policy for users to see their own profiles');
        console.log('   CREATE POLICY "Users can view own profile" ON public.profiles');
        console.log('   FOR SELECT USING (auth.uid() = user_id);');
        console.log('');
        console.log('   -- Add policy for users to update their own profiles');
        console.log('   CREATE POLICY "Users can update own profile" ON public.profiles');
        console.log('   FOR UPDATE USING (auth.uid() = user_id)');
        console.log('   WITH CHECK (auth.uid() = user_id);');
        console.log('');
        console.log('   -- Add policy for profile creation');
        console.log('   CREATE POLICY "Users can insert own profile" ON public.profiles');
        console.log('   FOR INSERT WITH CHECK (auth.uid() = user_id);');
        console.log('');
        
        // Try to get more information about the issue
        console.log('🔍 Attempting to gather more debug info...');
        
        // Check if user is authenticated
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        
        if (authError) {
          console.log('🔍 Auth error:', authError.message);
        } else if (user) {
          console.log('✅ User is authenticated:', user.email);
          console.log('   User ID:', user.id);
        } else {
          console.log('⚠️ No authenticated user found');
          console.log('   This might be why you\'re getting permission errors');
          console.log('   Try signing in first, then test again');
        }
        
      } else {
        console.log('❓ Different error type:', error.message);
      }
    } else {
      console.log('✅ Profiles table is accessible!');
      console.log(`   Found ${data?.length || 0} profiles`);
      console.log('   The permission error might have been resolved');
    }
    
  } catch (error) {
    console.error('�� Unexpected error:', error.message);
  }
  
  // Additional checks
  console.log('');
  console.log('🔍 Additional Debug Information:');
  console.log('================================');
  
  // Check Supabase connection
  try {
    const { data, error } = await supabase.from('blog_posts').select('id').limit(1);
    if (error) {
      console.log('⚠️ Blog posts access:', error.message);
    } else {
      console.log('✅ Blog posts table accessible');
    }
  } catch (err) {
    console.log('❌ Blog posts test failed:', err.message);
  }
  
  console.log('');
  console.log('🔧 Environment Check:');
  console.log('   Supabase URL:', SUPABASE_URL ? `${SUPABASE_URL.substring(0, 30)}...` : 'missing');
  console.log('   Anon Key:', SUPABASE_ANON_KEY ? `${SUPABASE_ANON_KEY.substring(0, 10)}...` : 'missing');
  
  console.log('');
  console.log('💡 If the manual fix above doesn\'t work:');
  console.log('   1. Check if you have admin access to your Supabase project');
  console.log('   2. Verify that the profiles table exists');
  console.log('   3. Check if there are any recursive RLS policies');
  console.log('   4. Consider reaching out for help with your specific setup');
}

// Run the test and show fix instructions
testAndFix().catch(error => {
  console.error('Script failed:', error.message);
  process.exit(1);
});
