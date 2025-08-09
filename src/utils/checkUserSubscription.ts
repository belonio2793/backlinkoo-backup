import { supabase } from '@/integrations/supabase/client';

export async function checkUserSubscription() {
  console.log('🔍 Checking user subscription in database...');
  
  try {
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      console.log('❌ No authenticated user:', userError?.message);
      return { success: false, message: 'No authenticated user' };
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
    
    // Check if user has active premium subscription
    const hasActivePremiumSub = subscription?.some((sub: any) => sub.status === 'active') || false;
    console.log('Has active premium subscription:', hasActivePremiumSub);
    
    return {
      success: true,
      user: user.email,
      profile,
      subscriptions: subscription,
      isPremiumByLogic,
      hasActivePremiumSub,
      shouldBePremium: hasActivePremiumSub || profile?.subscription_tier === 'premium' || profile?.role === 'premium'
    };
    
  } catch (error: any) {
    console.error('❌ Unexpected error:', error);
    return { success: false, message: error.message };
  }
}

// Make available globally for testing
(window as any).checkUserSubscription = checkUserSubscription;
