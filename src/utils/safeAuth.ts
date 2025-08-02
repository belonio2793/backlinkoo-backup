import { supabase } from '@/integrations/supabase/client';

/**
 * Safe wrapper for Supabase auth operations that handles session missing errors gracefully
 */
export class SafeAuth {
  
  /**
   * Safely get the current user without throwing auth session errors
   */
  static async getCurrentUser() {
    try {
      const { data: { user }, error } = await supabase.auth.getUser();
      
      if (error) {
        // Handle auth session missing error gracefully
        if (error.message.includes('Auth session missing')) {
          console.warn('⚠️ No auth session - user not signed in');
          return { user: null, error: null, needsAuth: true };
        }
        
        console.error('❌ Auth error:', error);
        return { user: null, error: error.message, needsAuth: true };
      }
      
      return { user, error: null, needsAuth: false };
      
    } catch (error: any) {
      console.error('❌ Auth check failed:', error);
      return { user: null, error: error.message, needsAuth: true };
    }
  }
  
  /**
   * Check if user is authenticated without throwing errors
   */
  static async isAuthenticated(): Promise<boolean> {
    const result = await this.getCurrentUser();
    return !!result.user && !result.needsAuth;
  }
  
  /**
   * Check if current user is admin without throwing errors
   */
  static async isAdmin(): Promise<{ isAdmin: boolean; needsAuth: boolean; error?: string }> {
    try {
      const userResult = await this.getCurrentUser();

      if (userResult.needsAuth || !userResult.user) {
        return { isAdmin: false, needsAuth: true };
      }

      // Emergency bypass for support admin email
      if (userResult.user.email === 'support@backlinkoo.com') {
        console.log('✅ Support admin email detected - granting admin access');
        return { isAdmin: true, needsAuth: false };
      }

      // Check user role in profiles table
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('role')
        .eq('user_id', userResult.user.id)
        .single();

      if (profileError) {
        console.error('❌ Profile check error:', profileError);

        // If this is the support admin, bypass the error
        if (userResult.user.email === 'support@backlinkoo.com') {
          console.log('✅ Support admin - bypassing profile check error');
          return { isAdmin: true, needsAuth: false };
        }

        return { isAdmin: false, needsAuth: false, error: profileError.message };
      }

      const isAdmin = profile?.role === 'admin';
      return { isAdmin, needsAuth: false };

    } catch (error: any) {
      console.error('❌ Admin check failed:', error);

      // Last resort: check if this is the support admin email
      try {
        const userResult = await this.getCurrentUser();
        if (userResult.user?.email === 'support@backlinkoo.com') {
          console.log('✅ Support admin - emergency access granted');
          return { isAdmin: true, needsAuth: false };
        }
      } catch {}

      return { isAdmin: false, needsAuth: true, error: error.message };
    }
  }
  
  /**
   * Safely sign out without throwing errors
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    try {
      const { error } = await supabase.auth.signOut();
      
      if (error) {
        console.error('❌ Sign out error:', error);
        return { success: false, error: error.message };
      }
      
      console.log('✅ User signed out successfully');
      return { success: true };
      
    } catch (error: any) {
      console.error('❌ Sign out failed:', error);
      return { success: false, error: error.message };
    }
  }
  
  /**
   * Safely sign in without throwing errors
   */
  static async signIn(email: string, password: string): Promise<{ 
    success: boolean; 
    user?: any; 
    error?: string; 
    isAdmin?: boolean; 
  }> {
    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password: password
      });

      if (signInError) {
        console.error('❌ Sign in error:', signInError);
        return { success: false, error: signInError.message };
      }

      if (!data.user) {
        return { success: false, error: 'Sign in failed - no user returned' };
      }

      console.log('✅ User signed in:', data.user.email);

      // Check admin status
      const adminCheck = await this.isAdmin();
      
      return { 
        success: true, 
        user: data.user, 
        isAdmin: adminCheck.isAdmin 
      };
      
    } catch (error: any) {
      console.error('❌ Sign in failed:', error);
      return { success: false, error: error.message };
    }
  }
}
