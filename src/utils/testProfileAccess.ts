import { supabase } from '@/integrations/supabase/client';

export async function testProfileAccess() {
  console.log('🧪 Testing profile access...');
  
  try {
    // Test 1: Simple count query
    const { count: totalCount, error: countError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
      
    console.log('📊 Total profiles count:', totalCount, 'error:', countError);
    
    // Test 2: Fetch first 5 profiles
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*')
      .limit(5);
      
    console.log('👥 First 5 profiles:', profiles?.length, 'error:', profilesError);
    
    // Test 3: Current user info
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    console.log('👤 Current user:', user?.email, user?.id, 'error:', userError);
    
    // Test 4: Current user's profile
    if (user) {
      const { data: currentProfile, error: currentProfileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
        
      console.log('🔑 Current user profile:', currentProfile, 'error:', currentProfileError);
    }
    
    return {
      totalCount,
      profilesCount: profiles?.length || 0,
      hasAccess: !profilesError && !countError,
      user: user?.email
    };
    
  } catch (error) {
    console.error('❌ Profile access test failed:', error);
    return {
      totalCount: 0,
      profilesCount: 0,
      hasAccess: false,
      error: error
    };
  }
}
