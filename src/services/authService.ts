import { supabase } from '@/integrations/supabase/client';
import { EmailService } from './emailService';
import { ProfileMigrationService } from './profileMigrationService';
import type { User, Session } from '@supabase/supabase-js';

export interface AuthResponse {
  success: boolean;
  user?: User | null;
  session?: Session | null;
  error?: string;
  requiresEmailVerification?: boolean;
}

export interface SignUpData {
  email: string;
  password: string;
  firstName?: string;
  metadata?: Record<string, any>;
}

export interface SignInData {
  email: string;
  password: string;
}



export class AuthService {
  private static readonly EMAIL_REDIRECT_BASE = typeof window !== 'undefined' 
    ? window.location.origin 
    : 'https://backlinkoo.com';

  /**
   * Sign up a new user with email verification
   */
  static async signUp(signUpData: SignUpData): Promise<AuthResponse> {
    try {
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
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }

      if (data.user) {
        return {
          success: true,
          user: data.user,
          session: data.session,
          requiresEmailVerification: !data.user.email_confirmed_at
        };
      }

      return {
        success: false,
        error: 'No user data received from signup'
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }

  /**
   * Sign in an existing user with email verification check
   */
  static async signIn(signInData: SignInData): Promise<AuthResponse> {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email: signInData.email.trim(),
        password: signInData.password
      });

      if (error) {
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }

      if (data.user && data.session) {
        // Check if email is verified
        if (!data.user.email_confirmed_at) {
          await supabase.auth.signOut();
          return {
            success: false,
            error: 'Email verification required. Please check your email for a verification link.',
            requiresEmailVerification: true
          };
        }

        return {
          success: true,
          user: data.user,
          session: data.session
        };
      }

      return {
        success: false,
        error: 'No user data received from signin'
      };
    } catch (error: any) {
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }

  /**
   * Send password reset email
   */
  static async resetPassword(email: string): Promise<AuthResponse> {
    try {
      console.log('🔑 AuthService: Sending password reset for:', email);

      const { error } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${this.EMAIL_REDIRECT_BASE}/auth/reset-password`
      });

      if (error) {
        console.error('AuthService: Password reset error:', error);
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }



      console.log('✅ AuthService: Password reset email sent');
      return {
        success: true
      };
    } catch (error: any) {
      console.error('AuthService: Password reset exception:', error);
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }

  /**
   * Resend email confirmation
   */
  static async resendConfirmation(email: string): Promise<AuthResponse> {
    try {
      console.log('📧 AuthService: Resending confirmation for:', email);

      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: email.trim(),
        options: {
          emailRedirectTo: `${this.EMAIL_REDIRECT_BASE}/auth/confirm`
        }
      });

      if (error) {
        console.error('AuthService: Resend confirmation error:', error);
        
        // Handle specific error cases
        if (error.message.includes('already confirmed') || error.message.includes('verified')) {
          return {
            success: false,
            error: 'Email is already verified. You can now sign in to your account.'
          };
        }
        
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }



      console.log('✅ AuthService: Confirmation email resent');
      return {
        success: true
      };
    } catch (error: any) {
      console.error('AuthService: Resend confirmation exception:', error);
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }

  /**
   * Update user password
   */
  static async updatePassword(newPassword: string): Promise<AuthResponse> {
    try {
      console.log('🔒 AuthService: Updating password');

      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });

      if (error) {
        console.error('AuthService: Password update error:', error);
        return {
          success: false,
          error: this.formatErrorMessage(error.message)
        };
      }

      console.log('✅ AuthService: Password updated successfully');
      return {
        success: true,
        user: data.user
      };
    } catch (error: any) {
      console.error('AuthService: Password update exception:', error);
      return {
        success: false,
        error: this.formatErrorMessage(error.message)
      };
    }
  }







  /**
   * Sign out user (instant)
   */
  static async signOut(): Promise<AuthResponse> {
    console.log('🚪 AuthService: Starting instant sign out');

    // Do sign out in background for instant UX
    setTimeout(() => {
      supabase.auth.signOut({ scope: 'global' }).catch((error) => {
        console.warn('Background sign out error (non-critical):', error);
      });
    }, 0);

    console.log('✅ AuthService: Instant sign out completed');
    return {
      success: true
    };
  }

  /**
   * Get current session
   */
  static async getCurrentSession(): Promise<{ session: Session | null; user: User | null }> {
    try {
      const { data, error } = await supabase.auth.getSession();
      
      if (error) {
        console.warn('AuthService: Session check error:', error);
        return { session: null, user: null };
      }

      return {
        session: data.session,
        user: data.session?.user || null
      };
    } catch (error) {
      console.error('AuthService: Session check exception:', error);
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
      console.error('AuthService: Email verification check failed:', error);
      return false;
    }
  }

  // Private helper methods

  private static async cleanupAuthState(): Promise<void> {
    try {
      // Check if there's already a valid session before cleaning up
      const { data: { session }, error } = await supabase.auth.getSession();

      if (session && session.user && session.user.email_confirmed_at) {
        console.log('AuthService: Valid session exists, skipping cleanup');
        return;
      }

      // Only sign out if there's no valid session or user isn't verified
      if (session && (!session.user || !session.user.email_confirmed_at)) {
        console.log('AuthService: Cleaning up invalid/unverified session');
        await supabase.auth.signOut({ scope: 'global' });
      }

      // Clear only problematic localStorage keys, not all auth tokens
      if (typeof window !== 'undefined') {
        const keysToRemove = [];

        for (let i = 0; i < localStorage.length; i++) {
          const key = localStorage.key(i);
          // Only remove specific problematic keys, not all auth tokens
          if (key && key.includes('sb-') && key.includes('error')) {
            keysToRemove.push(key);
          }
        }

        keysToRemove.forEach(key => {
          try {
            localStorage.removeItem(key);
          } catch (e) {
            console.warn('AuthService: Failed to remove localStorage key:', key);
          }
        });
      }

      // No delay needed for cleanup

    } catch (error) {
      console.warn('AuthService: Cleanup failed:', error);
    }
  }

  private static async ensureUserProfile(user: User, email: string, firstName?: string): Promise<void> {
    try {
      const metadata = {
        first_name: firstName?.trim(),
        display_name: firstName?.trim(),
        ...user.user_metadata
      };

      const result = await ProfileMigrationService.ensureUserProfile(
        user.id,
        email,
        metadata
      );

      if (!result.success) {
        console.warn('AuthService: Profile creation failed:', result.error);
      }
    } catch (error) {
      console.error('AuthService: Profile creation error:', error.message || error);
    }
  }

  private static async sendEnhancedConfirmationEmail(email: string): Promise<void> {
    try {
      await EmailService.sendConfirmationEmail(
        email,
        `${this.EMAIL_REDIRECT_BASE}/auth/confirm?email=${encodeURIComponent(email)}`
      );
      console.log('✅ AuthService: Enhanced confirmation email sent');
    } catch (error) {
      console.warn('AuthService: Enhanced confirmation email failed:', error);
    }
  }

  private static async sendEnhancedPasswordResetEmail(email: string): Promise<void> {
    try {
      await EmailService.sendPasswordResetEmail(
        email,
        `${this.EMAIL_REDIRECT_BASE}/auth/reset-password?email=${encodeURIComponent(email)}`
      );
      console.log('✅ AuthService: Enhanced password reset email sent');
    } catch (error) {
      console.warn('AuthService: Enhanced password reset email failed:', error);
    }
  }

  private static async sendEnhancedWelcomeEmail(email: string, name?: string): Promise<void> {
    try {
      await EmailService.sendWelcomeEmail(email, name);
      console.log('✅ AuthService: Enhanced welcome email sent');
    } catch (error) {
      console.warn('AuthService: Enhanced welcome email failed:', error);
    }
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

// Auth state change listener setup
export const setupAuthStateListener = (callback: (event: string, session: Session | null) => void) => {
  return supabase.auth.onAuthStateChange((event, session) => {
    console.log('🔐 Auth state changed:', event, !!session);
    callback(event, session);
  });
};
