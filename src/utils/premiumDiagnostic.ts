import { supabase } from '@/integrations/supabase/client';

export async function diagnosePremiumStatus(userId: string) {
  console.log('🔧 Premium Status Diagnostic for user:', userId);
  
  try {
    // Test 1: Check if we can access the table at all
    console.log('📊 Test 1: Checking table access...');
    const { data: allSubs, error: allError } = await supabase
      .from('premium_subscriptions')
      .select('count(*)')
      .limit(1);
    
    if (allError) {
      console.error('❌ Cannot access premium_subscriptions table:', allError);
      return { canAccessTable: false, error: allError };
    }
    
    console.log('✅ Can access table, total records:', allSubs);
    
    // Test 2: Check for this specific user
    console.log('📊 Test 2: Checking user-specific records...');
    const { data: userSubs, error: userError } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId);
    
    if (userError) {
      console.error('❌ Error fetching user subscriptions:', userError);
      return { canAccessTable: true, userRecords: null, error: userError };
    }
    
    console.log('✅ User subscription records:', userSubs);
    
    // Test 3: Check active subscriptions
    if (userSubs && userSubs.length > 0) {
      console.log('📊 Test 3: Checking active subscriptions...');
      const activeSubs = userSubs.filter(sub => 
        sub.status === 'active' && 
        new Date(sub.current_period_end) > new Date()
      );
      console.log('✅ Active subscriptions:', activeSubs);
      
      return {
        canAccessTable: true,
        userRecords: userSubs,
        activeRecords: activeSubs,
        isPremium: activeSubs.length > 0
      };
    }
    
    return {
      canAccessTable: true,
      userRecords: userSubs,
      activeRecords: [],
      isPremium: false
    };
    
  } catch (error) {
    console.error('❌ Diagnostic failed:', error);
    return { error };
  }
}
