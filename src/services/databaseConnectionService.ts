import { supabase } from '@/integrations/supabase/client';

export interface ConnectionTestResult {
  success: boolean;
  profileCount: number;
  error?: string;
  userInfo?: {
    authenticated: boolean;
    userId?: string;
    email?: string;
    role?: string;
  };
  details?: {
    supabaseUrl?: string;
    hasAnonKey: boolean;
    tableAccess?: string;
    rlsPolicies?: string;
  };
}

class DatabaseConnectionService {
  
  /**
   * Comprehensive database connection test
   */
  async testConnection(): Promise<ConnectionTestResult> {
    try {
      console.log('🔍 Starting comprehensive database connection test...');
      
      // Step 1: Check Supabase client configuration
      const supabaseUrl = supabase.supabaseUrl;
      const hasAnonKey = !!supabase.supabaseKey;
      
      console.log('📍 Supabase URL:', supabaseUrl);
      console.log('🔑 Has anon key:', hasAnonKey);
      
      // Step 2: Check authentication status
      const { data: { user }, error: authError } = await supabase.auth.getUser();

      if (authError) {
        console.error('❌ Auth error:', authError);

        // Handle specific auth session missing error
        if (authError.message.includes('Auth session missing')) {
          return {
            success: false,
            profileCount: 0,
            error: 'Please sign in to access admin features',
            userInfo: {
              authenticated: false
            },
            details: {
              supabaseUrl,
              hasAnonKey,
              tableAccess: 'Sign in required'
            }
          };
        }

        return {
          success: false,
          profileCount: 0,
          error: `Authentication error: ${authError.message}`,
          userInfo: {
            authenticated: false
          },
          details: {
            supabaseUrl,
            hasAnonKey,
            tableAccess: 'Auth failed'
          }
        };
      }
      
      if (!user) {
        console.warn('⚠️ No authenticated user');
        return {
          success: false,
          profileCount: 0,
          error: 'No authenticated user. Please sign in first.',
          userInfo: {
            authenticated: false
          },
          details: {
            supabaseUrl,
            hasAnonKey,
            tableAccess: 'No user'
          }
        };
      }
      
      console.log('✅ User authenticated:', user.email);
      
      // Step 3: Check user profile and role
      let userRole = 'unknown';
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role, email, display_name')
          .eq('user_id', user.id)
          .single();
        
        if (profile) {
          userRole = profile.role;
          console.log('✅ User profile found:', profile.email, 'Role:', profile.role);
        } else {
          console.warn('⚠️ No profile found for user');
        }
      } catch (error) {
        console.warn('⚠️ Could not fetch user profile:', error);
      }
      
      // Step 4: Test basic profiles table access
      console.log('🔍 Testing profiles table access...');
      
      // Try different access methods
      const testMethods = [
        {
          name: 'Direct SELECT with count',
          test: async () => {
            const { data, error, count } = await supabase
              .from('profiles')
              .select('*', { count: 'exact', head: true });
            return { data, error, count };
          }
        },
        {
          name: 'SELECT with limit 1',
          test: async () => {
            const { data, error } = await supabase
              .from('profiles')
              .select('id, email, role')
              .limit(1);
            return { data, error, count: data?.length || 0 };
          }
        },
        {
          name: 'RPC function (if available)',
          test: async () => {
            const { data, error } = await supabase.rpc('get_profiles_admin_bypass');
            return { data, error, count: data?.length || 0 };
          }
        }
      ];
      
      let successfulMethod = null;
      let profileCount = 0;
      let lastError = null;
      
      for (const method of testMethods) {
        try {
          console.log(`🧪 Testing: ${method.name}...`);
          const result = await method.test();
          
          if (!result.error && (result.count !== undefined && result.count >= 0)) {
            console.log(`✅ ${method.name} successful: ${result.count} profiles`);
            successfulMethod = method.name;
            profileCount = result.count || 0;
            break;
          } else if (result.error) {
            console.warn(`❌ ${method.name} failed:`, result.error.message);
            lastError = result.error;
          }
        } catch (error: any) {
          console.warn(`❌ ${method.name} threw error:`, error.message);
          lastError = error;
        }
      }
      
      if (successfulMethod) {
        return {
          success: true,
          profileCount,
          userInfo: {
            authenticated: true,
            userId: user.id,
            email: user.email || 'Unknown',
            role: userRole
          },
          details: {
            supabaseUrl,
            hasAnonKey,
            tableAccess: `Success via ${successfulMethod}`,
            rlsPolicies: 'Working'
          }
        };
      } else {
        // All methods failed
        const errorMessage = lastError 
          ? `Database access failed: ${lastError.message}` 
          : 'All database access methods failed';
          
        return {
          success: false,
          profileCount: 0,
          error: errorMessage,
          userInfo: {
            authenticated: true,
            userId: user.id,
            email: user.email || 'Unknown',
            role: userRole
          },
          details: {
            supabaseUrl,
            hasAnonKey,
            tableAccess: 'All methods failed',
            rlsPolicies: 'Check RLS policies'
          }
        };
      }
      
    } catch (error: any) {
      console.error('❌ Connection test failed:', error);
      return {
        success: false,
        profileCount: 0,
        error: `Connection test failed: ${error.message}`,
        details: {
          hasAnonKey: false,
          tableAccess: 'Test failed'
        }
      };
    }
  }
  
  /**
   * Quick connection status check
   */
  async quickConnectionCheck(): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1)
        .single();
      
      return !error;
    } catch (error) {
      return false;
    }
  }
  
  /**
   * Check if user has admin privileges
   */
  async checkAdminAccess(): Promise<{
    isAdmin: boolean;
    method?: string;
    error?: string;
  }> {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      if (!user) {
        return { isAdmin: false, error: 'Not authenticated' };
      }
      
      // Check via profiles table
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', user.id)
        .single();
      
      if (error) {
        return { isAdmin: false, error: error.message };
      }
      
      const isAdmin = profile?.role === 'admin';
      return { 
        isAdmin, 
        method: isAdmin ? 'profiles.role' : 'not admin'
      };
      
    } catch (error: any) {
      return { isAdmin: false, error: error.message };
    }
  }
}

export const databaseConnectionService = new DatabaseConnectionService();
