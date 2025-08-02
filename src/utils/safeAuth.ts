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

      // TEMPORARY FIX: Bypass RLS recursion issue
      // Check if user email is the admin email as a fallback
      if (userResult.user.email === 'support@backlinkoo.com') {
        console.log('✅ Admin user detected by email (bypassing RLS)');
        return { isAdmin: true, needsAuth: false };
      }

      // Try to check user role in profiles table with RLS bypass
      try {
        const { data: profile, error: profileError } = await supabase
          .from('profiles')
          .select('role')
          .eq('user_id', userResult.user.id)
          .single();

        if (profileError) {
          // If RLS error, check by email as fallback
          if (profileError.message?.includes('infinite recursion') ||
              profileError.message?.includes('policy')) {
            console.warn('⚠️ RLS recursion detected, using email fallback');
            return {
              isAdmin: userResult.user.email === 'support@backlinkoo.com',
              needsAuth: false
            };
          }

          console.error('❌ Profile check error:', profileError);
          return { isAdmin: false, needsAuth: false, error: profileError.message };
        }

        const isAdmin = profile?.role === 'admin';
        return { isAdmin, needsAuth: false };

      } catch (profileQueryError: any) {
        console.warn('⚠️ Profile query failed, using email fallback:', profileQueryError.message);
        return {
          isAdmin: userResult.user.email === 'support@backlinkoo.com',
          needsAuth: false
        };
      }

    } catch (error: any) {
      console.error('❌ Admin check failed:', error);
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
