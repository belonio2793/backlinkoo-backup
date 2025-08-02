import { supabase } from '@/integrations/supabase/client';

export const testDatabaseConnection = async () => {
  console.log('🔍 Testing database connection...');
  
  try {
    // Test 1: Simple connection test
    console.log('📡 Test 1: Basic connection');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count', { count: 'exact', head: true });
    
    if (connectionError) {
      console.error('❌ Connection test failed:', connectionError);
      return { success: false, error: connectionError.message };
    }
    
    console.log('✅ Connection test passed');
    
    // Test 2: Try to get profiles
    console.log('📡 Test 2: Fetching profiles');
    const { data: profiles, error: profilesError, count } = await supabase
      .from('profiles')
      .select('*', { count: 'exact' })
      .limit(5);
    
    if (profilesError) {
      console.error('❌ Profiles fetch failed:', profilesError);
      return { success: false, error: profilesError.message };
    }
    
    console.log('✅ Profiles fetch successful:', {
      count,
      profiles: profiles?.length,
      sampleData: profiles?.[0]
    });
    
    // Test 3: Check auth status
    console.log('📡 Test 3: Auth status');
    const { data: authData, error: authError } = await supabase.auth.getSession();
    
    if (authError) {
      console.warn('⚠️ Auth check failed:', authError);
    } else {
      console.log('✅ Auth status:', {
        hasSession: !!authData.session,
        user: authData.session?.user?.email || 'not authenticated'
      });
    }
    
    return {
      success: true,
      data: {
        profileCount: count,
        profiles: profiles,
        hasAuth: !!authData.session
      }
    };
    
  } catch (error: any) {
    console.error('❌ Database test failed:', error);
    return { success: false, error: error.message };
  }
};
