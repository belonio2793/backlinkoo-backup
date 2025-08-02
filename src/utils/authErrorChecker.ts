import { supabase } from '@/integrations/supabase/client';

export class AuthErrorChecker {
  static async runFullDiagnostic() {
    console.log('🔍 Running Full Authentication Diagnostic');
    
    const results = {
      envCheck: await this.checkEnvironmentVariables(),
      connectionCheck: await this.checkDatabaseConnection(),
      authCheck: await this.checkAuthService(),
      userCreationCheck: await this.checkUserCreation(),
      signInCheck: await this.checkSignIn()
    };
    
    console.log('📊 Full Diagnostic Results:', results);
    return results;
  }
  
  static async checkEnvironmentVariables() {
    const envUrl = import.meta.env.VITE_SUPABASE_URL;
    const envKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
    
    return {
      hasUrl: !!envUrl,
      hasKey: !!envKey,
      urlValid: envUrl?.startsWith('https://') && envUrl?.includes('.supabase.co'),
      keyValid: envKey?.startsWith('eyJ') && envKey?.length > 100,
      urlPreview: envUrl ? envUrl.substring(0, 40) + '...' : 'Missing',
      keyPreview: envKey ? envKey.substring(0, 20) + '...' : 'Missing'
    };
  }
  
  static async checkDatabaseConnection() {
    try {
      const { data, error } = await supabase.from('profiles').select('count', { count: 'exact', head: true });
      return {
        success: !error,
        error: error?.message,
        canAccessProfiles: !error
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        exception: true
      };
    }
  }
  
  static async checkAuthService() {
    try {
      const { data, error } = await supabase.auth.getSession();
      return {
        success: !error,
        error: error?.message,
        hasSession: !!data.session,
        currentUser: data.session?.user?.email || null
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        exception: true
      };
    }
  }
  
  static async checkUserCreation() {
    try {
      // Try to create a test user with a unique email
      const testEmail = `test-${Date.now()}@example.com`;
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'testpassword123',
        options: {
          data: {
            first_name: 'Test',
            display_name: 'Test User'
          }
        }
      });
      
      // Clean up by signing out immediately
      if (data.session) {
        await supabase.auth.signOut();
      }
      
      return {
        success: !error,
        error: error?.message,
        userCreated: !!data.user,
        needsConfirmation: data.user && !data.user.email_confirmed_at,
        testEmail
      };
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        exception: true
      };
    }
  }
  
  static async checkSignIn() {
    try {
      // Try to sign in with known test credentials
      const { data, error } = await supabase.auth.signInWithPassword({
        email: 'test@example.com',
        password: 'testpassword123'
      });
      
      const result = {
        success: !error,
        error: error?.message,
        hasUser: !!data.user,
        hasSession: !!data.session,
        emailConfirmed: data.user?.email_confirmed_at ? true : false,
        userDetails: data.user ? {
          id: data.user.id,
          email: data.user.email,
          created_at: data.user.created_at
        } : null
      };
      
      // Sign out after test
      if (data.session) {
        await supabase.auth.signOut();
      }
      
      return result;
    } catch (err: any) {
      return {
        success: false,
        error: err.message,
        exception: true
      };
    }
  }
  
  static async testSpecificCredentials(email: string, password: string) {
    console.log(`🔐 Testing specific credentials: ${email}`);
    
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      const result = {
        success: !error,
        error: error?.message,
        errorCode: error?.status,
        hasUser: !!data.user,
        hasSession: !!data.session,
        emailConfirmed: data.user?.email_confirmed_at ? true : false
      };
      
      console.log('Sign in result:', result);
      
      // Don't sign out automatically for user testing
      return result;
    } catch (err: any) {
      const result = {
        success: false,
        error: err.message,
        exception: true
      };
      console.error('Sign in exception:', result);
      return result;
    }
  }
}

// Make available globally for console testing
if (typeof window !== 'undefined') {
  (window as any).AuthErrorChecker = AuthErrorChecker;
  
  // Auto-run diagnostic in development
  if (import.meta.env.DEV) {
    setTimeout(() => {
      AuthErrorChecker.runFullDiagnostic();
    }, 3000);
  }
}
