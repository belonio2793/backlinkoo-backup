import { supabase } from './src/integrations/supabase/client.js';

async function checkUserSubscription() {
  console.log('🔍 Checking user subscription in database...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user:', userError?.message);
      return;
    }
    
    console.log('👤 Current user:', user.email);
    console.log('👤 User ID:', user.id);
    
    // Check profiles table
    console.log('\n📊 Checking profiles table...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
      
    if (profileError) {
      console.log('❌ Profile error:', profileError.message);
    } else {
      console.log('✅ Profile found:', JSON.stringify(profile, null, 2));
    }
    
    // Check premium_subscriptions table
    console.log('\n💎 Checking premium_subscriptions table...');
    const { data: subscription, error: subError } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id);
      
    if (subError) {
      console.log('❌ Subscription error:', subError.message);
    } else {
      console.log('✅ Subscriptions found:', JSON.stringify(subscription, null, 2));
    }
    
    // Check subscriptions table (if exists)
    console.log('\n🔔 Checking subscriptions table...');
    const { data: generalSub, error: generalSubError } = await supabase
      .from('subscriptions')
      .select('*')
      .eq('user_id', user.id);
      
    if (generalSubError) {
      console.log('⚠️ General subscriptions error:', generalSubError.message);
    } else {
      console.log('✅ General subscriptions found:', JSON.stringify(generalSub, null, 2));
    }
    
    // Check user_metadata or any other user-related tables
    console.log('\n🔍 Checking all user-related tables...');
    
    // List all tables to see what's available
    const { data: tables, error: tablesError } = await supabase
      .rpc('get_table_names');
      
    if (tablesError) {
      console.log('⚠️ Could not get table names:', tablesError.message);
    }
    
    // Final summary
    console.log('\n📋 SUMMARY:');
    console.log('User:', user.email);
    console.log('Profile role:', profile?.role || 'N/A');
    console.log('Profile subscription_tier:', profile?.subscription_tier || 'N/A');
    console.log('Profile subscription_status:', profile?.subscription_status || 'N/A');
    console.log('Premium subscriptions count:', subscription?.length || 0);
    
    // Check premium status based on current logic
    const isPremiumByLogic = profile?.subscription_tier === 'premium' ||
                            profile?.subscription_tier === 'monthly' ||
                            profile?.role === 'admin';
                            
    console.log('Is premium by current logic:', isPremiumByLogic);
    
  } catch (error) {
    console.error('❌ Unexpected error:', error);
  }
}

checkUserSubscription().catch(console.error);
