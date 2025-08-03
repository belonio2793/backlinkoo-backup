import { supabase } from '@/integrations/supabase/client';

export class AuthDebugHelper {
  static async checkCurrentUser() {
    try {
      console.log('🔍 Checking current user and permissions...');
      
      // Check current auth user
      const { data: { user }, error: authError } = await supabase.auth.getUser();
      
      if (authError) {
        console.error('❌ Auth error:', authError.message);
        return { success: false, error: authError.message };
      }
      
      if (!user) {
        console.log('ℹ️ No authenticated user');
        return { success: true, user: null, profile: null };
      }
      
      console.log('✅ Authenticated user:', {
        id: user.id,
        email: user.email,
        created_at: user.created_at
      });
      
      // Try to fetch profile
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();
      
      if (profileError) {
        console.error('❌ Profile fetch error:', profileError.message);
        return { 
          success: false, 
          error: `Profile fetch failed: ${profileError.message}`,
          user,
          profile: null
        };
      }
      
      console.log('✅ Profile found:', profile);
      
      return {
        success: true,
        user,
        profile
      };
      
    } catch (error: any) {
      console.error('❌ Auth debug error:', error);
      return { success: false, error: error.message };
    }
  }
  
  static async testPermissions() {
    console.log('🔐 Testing basic table permissions...');
    
    const tests = [
      {
        name: 'profiles',
        query: () => supabase.from('profiles').select('user_id, email, role').limit(1)
      },
      {
        name: 'blog_posts',
        query: () => supabase.from('blog_posts').select('id, title, status').limit(1)
      }
    ];
    
    for (const test of tests) {
      try {
        const { data, error } = await test.query();
        
        if (error) {
          console.log(`❌ ${test.name} table error:`, error.message);
        } else {
          console.log(`✅ ${test.name} table accessible, found ${data?.length || 0} records`);
        }
      } catch (e: any) {
        console.log(`❌ ${test.name} table exception:`, e.message);
      }
    }
  }
}
