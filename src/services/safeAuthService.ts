import { supabase } from '@/integrations/supabase/client';
import type { User, Session } from '@supabase/supabase-js';

export interface SafeAuthResponse {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface SafeSignInData {
  email: string;
  password: string;
}

export interface SafeSignUpData {
  email: string;
  password: string;
  firstName?: string;
  metadata?: Record<string, any>;
}

/**
 * Safe Authentication Service that bypasses complex database operations
 * during sign-in to prevent "Database error granting user" issues
 */
export class SafeAuthService {
  private static readonly EMAIL_REDIRECT_BASE = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://backlinkoo.com';

  /**
   * Simple sign-in without additional database operations
   */
  static async signIn(signInData: SafeSignInData): Promise<SafeAuthResponse> {
    try {
      console.log('🔐 SafeAuth: Attempting sign-in for:', signInData.email);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email.trim(),
        password: signInData.password
      });

      if (error) {
        console.error('SafeAuth: Sign-in error:', error);
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }

      if (data.user && data.session) {
        // Check email verification but don't fail on database issues
        if (!data.user.email_confirmed_at) {
          await this.safeSignOut();
          return {
            success: false,
            error: 'Email verification required. Please check your email for a verification link.',
            requiresEmailVerification: true
          };
        }

        console.log('✅ SafeAuth: Sign-in successful for:', data.user.email);
        
        // Try to ensure profile exists in background (don't wait or fail on errors)
        this.ensureProfileInBackground(data.user);

        return {
          success: true,
          user: data.user,
          session: data.session
        };
      }

      return {
        success: false,
        error: 'No user data received from sign-in'
      };
    } catch (error: any) {
      console.error('SafeAuth: Sign-in exception:', error);
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }

  /**
   * Simple sign-up with minimal database operations
   */
  static async signUp(signUpData: SafeSignUpData): Promise<SafeAuthResponse> {
    try {
      console.log('🆕 SafeAuth: Attempting sign-up for:', signUpData.email);

      const { data, error } = await supabase.auth.signUp({
        email: signUpData.email.trim(),
        password: signUpData.password,
        options: {
          emailRedirectTo: `${this.EMAIL_REDIRECT_BASE}/auth/confirm`,
          data: {
            first_name: signUpData.firstName?.trim(),
            display_name: signUpData.firstName?.trim(),
            ...signUpData.metadata
          }
        }
      });

      if (error) {
        console.error('SafeAuth: Sign-up error:', error);
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }

      if (data.user) {
        console.log('✅ SafeAuth: Sign-up successful for:', data.user.email);
        
        // Try to create profile in background (don't wait or fail on errors)
        this.ensureProfileInBackground(data.user);

        return {
          success: true,
          user: data.user,
          session: data.session,
          requiresEmailVerification: !data.user.email_confirmed_at
        };
      }

      return {
        success: false,
        error: 'No user data received from sign-up'
      };
    } catch (error: any) {
      console.error('SafeAuth: Sign-up exception:', error);
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }

  /**
   * Safe sign-out
   */
  static async signOut(): Promise<SafeAuthResponse> {
    return this.safeSignOut();
  }

  /**
   * Get current session safely
   */
  static async getCurrentSession(): Promise<{ session: Session | null; user: User | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('SafeAuth: Session check error:', error);
        return { session: null, user: null };
      }

      return {
        session: data.session,
        user: data.session?.user || null
      };
    } catch (error) {
      console.error('SafeAuth: Session check exception:', error);
      return { session: null, user: null };
    }
  }

  /**
   * Check if user email is verified
   */
  static async isEmailVerified(): Promise<boolean> {
    try {
      const { user } = await this.getCurrentSession();
      return user?.email_confirmed_at !== null && user?.email_confirmed_at !== undefined;
    } catch (error) {
      console.error('SafeAuth: Email verification check failed:', error);
      return false;
    }
  }

  // Private helper methods

  private static async safeSignOut(): Promise<SafeAuthResponse> {
    try {
      console.log('🚪 SafeAuth: Signing out');
      await supabase.auth.signOut({ scope: 'global' });
      console.log('✅ SafeAuth: Sign-out completed');
      return { success: true };
    } catch (error: any) {
      console.warn('SafeAuth: Sign-out error (non-critical):', error);
      return { success: true }; // Still return success as user intent is fulfilled
    }
  }

  private static async ensureProfileInBackground(user: User): Promise<void> {
    // Run profile creation in background without blocking sign-in
    setTimeout(async () => {
      try {
        console.log('🔧 SafeAuth: Ensuring profile exists for:', user.id);

        // Check if profile exists
        const { data: existingProfile, error: checkError } = await supabase
          .from('profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .single();

        if (checkError && checkError.code !== 'PGRST116') {
          console.warn('SafeAuth: Profile check failed:', checkError.message);
          return;
        }

        if (existingProfile) {
          console.log('✅ SafeAuth: Profile already exists');
          return;
        }

        // Create profile
        const displayName = user.user_metadata?.first_name || 
                           user.user_metadata?.display_name || 
                           user.email?.split('@')[0] || 
                           'User';

        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: user.id,
            email: user.email,
            display_name: displayName,
            role: 'user'
          });

        if (insertError) {
          console.warn('SafeAuth: Background profile creation failed:', insertError.message);
        } else {
          console.log('✅ SafeAuth: Background profile created successfully');
        }

      } catch (error: any) {
        console.warn('SafeAuth: Background profile operation failed:', error.message);
      }
    }, 1000); // Wait 1 second to not interfere with sign-in flow
  }

  private static formatErrorMessage(message: string): string {
    // Format common auth error messages for better user experience
    if (message.includes('Invalid login credentials')) {
      return 'Invalid email or password. Please check your credentials and try again.';
    }
    if (message.includes('Email not confirmed')) {
      return 'Your email address needs to be verified. Please check your email for a confirmation link.';
    }
    if (message.includes('User already registered')) {
      return 'An account with this email already exists. Please try signing in instead.';
    }
    if (message.includes('Password should be at least')) {
      return 'Password must be at least 6 characters long.';
    }
    if (message.includes('rate limit') || message.includes('too many')) {
      return 'Too many attempts. Please wait a few minutes before trying again.';
    }
    if (message.includes('network') || message.includes('fetch')) {
      return 'Network error. Please check your internet connection and try again.';
    }
    
    // Return the original message if no specific formatting is needed
    return message;
  }
}
