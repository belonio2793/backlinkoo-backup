import { supabase } from './src/integrations/supabase/client.js';

async function checkUserPremium() {
  console.log('🔍 Checking current user profile...');
  
  // Get current user
  const { data: { user }, error: userError } = await supabase.auth.getUser();
  if (userError || !user) {
    console.log('❌ No authenticated user:', userError?.message);
    return;
  }
  
  console.log('👤 Current user:', user.email);
  
  // Get profile
  const { data: profile, error: profileError } = await supabase
    .from('profiles')
    .select('*')
    .eq('user_id', user.id)
    .single();
    
  if (profileError) {
    console.log('❌ Profile error:', profileError.message);
    console.log('   This might be why premium status is not detected');
    return;
  }
  
  console.log('📊 User profile:', JSON.stringify(profile, null, 2));
  
  // Check premium status based on the service logic
  const isPremium = profile?.subscription_tier === 'premium' ||
                   profile?.subscription_tier === 'monthly' ||
                   profile?.role === 'admin';
                   
  console.log('🎯 Premium status calculation:');
  console.log('  subscription_tier:', profile?.subscription_tier);
  console.log('  role:', profile?.role);
  console.log('  isPremium:', isPremium);
  
  if (!isPremium && user.email === 'labindalawamaryrose@gmail.com') {
    console.log('🔧 User should be premium but isn\'t detected as such');
    console.log('   Need to update profile to premium status');
  }
}

checkUserPremium().catch(console.error);
