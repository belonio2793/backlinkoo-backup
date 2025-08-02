import { supabase } from '@/integrations/supabase/client';

/**
 * Emergency authentication fix for immediate testing
 * This bypasses some of the complex auth flow to identify the root issue
 */
export class EmergencyAuthFix {
  
  static async testBasicSignIn(email: string, password: string) {
    console.log('🚨 Emergency Auth Test - Basic Sign In');
    
    try {
      // Test the most basic Supabase auth call
      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });
      
      console.log('Raw Supabase auth result:', {
        success: !error,
        error: error?.message,
        errorCode: error?.status,
        hasUser: !!data.user,
        hasSession: !!data.session,
        userDetails: data.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at,
          createdAt: data.user.created_at,
          appMetadata: data.user.app_metadata,
          userMetadata: data.user.user_metadata
        } : null
      });
      
      if (error) {
        // Log specific error details
        console.error('🚨 Auth Error Details:', {
          message: error.message,
          status: error.status,
          name: error.name,
          stack: error.stack
        });
        
        return {
          success: false,
          error: error.message,
          errorCode: error.status,
          rawError: error
        };
      }
      
      // If successful, test profile access
      if (data.user) {
        console.log('✅ Auth successful, testing profile access...');
        
        try {
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('user_id', data.user.id)
            .single();
            
          console.log('Profile access result:', {
            hasProfile: !!profile,
            profileError: profileError?.message,
            profile: profile
          });
          
          return {
            success: true,
            user: data.user,
            session: data.session,
            profile: profile,
            profileError: profileError?.message
          };
        } catch (profileErr: any) {
          console.error('Profile access exception:', profileErr);
          return {
            success: true,
            user: data.user,
            session: data.session,
            profileError: profileErr.message
          };
        }
      }
      
      return {
        success: true,
        user: data.user,
        session: data.session
      };
      
    } catch (exception: any) {
      console.error('🚨 Auth Exception:', exception);
      return {
        success: false,
        error: exception.message,
        exception: true
      };
    }
  }
  
  static async createSimpleTestUser() {
    console.log('🚨 Emergency Auth Test - Create Simple User');
    
    const testEmail = `test-${Date.now()}@example.com`;
    const testPassword = 'testpass123';
    
    try {
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: testPassword
      });
      
      console.log('User creation result:', {
        success: !error,
        error: error?.message,
        errorCode: error?.status,
        user: data.user ? {
          id: data.user.id,
          email: data.user.email,
          emailConfirmed: data.user.email_confirmed_at
        } : null
      });
      
      // Clean up test user
      if (data.session) {
        await supabase.auth.signOut();
      }
      
      return {
        success: !error,
        error: error?.message,
        testEmail,
        user: data.user
      };
      
    } catch (exception: any) {
      console.error('🚨 User Creation Exception:', exception);
      return {
        success: false,
        error: exception.message,
        exception: true
      };
    }
  }
  
  static async testDatabasePermissions() {
    console.log('🚨 Emergency Auth Test - Database Permissions');
    
    const tests = {
      profilesRead: await this.testTableAccess('profiles', 'select'),
      profilesWrite: await this.testTableAccess('profiles', 'insert'),
      authUsers: await this.testAuthUsers()
    };
    
    console.log('Database permissions test:', tests);
    return tests;
  }
  
  private static async testTableAccess(table: string, operation: 'select' | 'insert') {
    try {
      if (operation === 'select') {
        const { data, error } = await supabase
          .from(table)
          .select('count', { count: 'exact', head: true });
          
        return {
          success: !error,
          error: error?.message,
          operation: 'select'
        };
      } else {
        // Test insert with dummy data that will likely fail but tells us about permissions
        const { data, error } = await supabase
          .from(table)
          .insert({
            user_id: 'test-id-' + Date.now(),
            email: 'test@test.com',
            display_name: 'Test'
          });
          
        return {
          success: !error,
          error: error?.message,
          operation: 'insert',
          note: 'This test insert is expected to fail, we are testing permissions only'
        };
      }
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        operation,
        exception: true
      };
    }
  }
  
  private static async testAuthUsers() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return {
        success: !error,
        error: error?.message,
        hasSession: !!data.session
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        exception: true
      };
    }
  }
}

// Make available globally for emergency testing
if (typeof window !== 'undefined') {
  (window as any).EmergencyAuthFix = EmergencyAuthFix;
  
  console.log(`
🚨 EMERGENCY AUTH FIX LOADED
  
Test commands:
- EmergencyAuthFix.testBasicSignIn('email', 'password')
- EmergencyAuthFix.createSimpleTestUser()
- EmergencyAuthFix.testDatabasePermissions()
  
Try with your actual credentials or test user
  `);
}
