import { supabase } from '@/integrations/supabase/client';
import { AuthService } from './authService';

export interface RegistrationData {
  email: string;
  password: string;
  firstName: string;
}

export interface RegistrationResult {
  success: boolean;
  user?: any;
  error?: string;
  requiresEmailVerification?: boolean;
}

/**
 * Enhanced user registration service that handles profile creation manually
 * This bypasses issues with the database trigger function
 */
export class UserRegistrationService {
  
  /**
   * Register a new user with manual profile creation
   */
  static async registerUser(data: RegistrationData): Promise<RegistrationResult> {
    try {
      console.log('🆕 Starting user registration for:', data.email);

      // Step 1: Create the auth user using Supabase Auth
      const authResult = await AuthService.signUp({
        email: data.email,
        password: data.password,
        firstName: data.firstName
      });

      if (!authResult.success || !authResult.user) {
        return {
          success: false,
          error: authResult.error || 'Failed to create user account'
        };
      }

      console.log('✅ Auth user created:', authResult.user.id);

      // Step 2: If the trigger failed to create the profile, create it manually
      try {
        await this.ensureUserProfileExists(authResult.user);
        console.log('✅ User profile ensured');
      } catch (profileError: any) {
        console.warn('⚠️ Profile creation/check failed:', profileError.message);
        // Don't fail the registration for profile issues - user can still use the app
      }

      return {
        success: true,
        user: authResult.user,
        requiresEmailVerification: authResult.requiresEmailVerification
      };

    } catch (error: any) {
      console.error('❌ Registration failed:', error);
      return {
        success: false,
        error: error.message || 'Registration failed'
      };
    }
  }

  /**
   * Ensure a user profile exists, create one if missing
   */
  private static async ensureUserProfileExists(user: any): Promise<void> {
    try {
      // Check if profile already exists
      const { data: existingProfile, error: checkError } = await supabase
        .from('profiles')
        .select('user_id')
        .eq('user_id', user.id)
        .single();

      if (checkError && checkError.code !== 'PGRST116') {
        // PGRST116 means "not found", which is fine
        throw new Error(`Profile check failed: ${checkError.message}`);
      }

      if (existingProfile) {
        console.log('✅ Profile already exists for user:', user.id);
        return;
      }

      // Profile doesn't exist, create it
      console.log('🔨 Creating profile for user:', user.id);
      
      const profileData = {
        user_id: user.id,
        email: user.email,
        display_name: user.user_metadata?.display_name || 
                     user.user_metadata?.first_name || 
                     user.email.split('@')[0],
        role: 'user',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      const { error: insertError } = await supabase
        .from('profiles')
        .insert(profileData);

      if (insertError) {
        throw new Error(`Profile creation failed: ${insertError.message}`);
      }

      console.log('✅ Profile created successfully for user:', user.id);

      // Try to create initial credits entry (optional, don't fail if this doesn't work)
      try {
        const { error: creditsError } = await supabase
          .from('credits')
          .insert({
            user_id: user.id,
            amount: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          });

        if (creditsError) {
          console.warn('⚠️ Credits initialization failed:', creditsError.message);
        } else {
          console.log('✅ Credits initialized for user:', user.id);
        }
      } catch (creditsError: any) {
        console.warn('⚠️ Credits table may not exist:', creditsError.message);
      }

    } catch (error: any) {
      console.error('❌ Profile creation process failed:', error);
      throw error;
    }
  }

  /**
   * Check if user registration is working properly
   */
  static async testRegistration(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('🧪 Testing registration system...');

      // Test email
      const testEmail = `test-${Date.now()}@example.com`;

      // Test basic auth signup
      const { data, error } = await supabase.auth.signUp({
        email: testEmail,
        password: 'password123',
        options: {
          data: {
            first_name: 'Test User'
          }
        }
      });

      if (error) {
        return {
          success: false,
          error: `Auth signup test failed: ${error.message}`
        };
      }

      if (!data.user) {
        return {
          success: false,
          error: 'Auth signup returned no user data'
        };
      }

      console.log('✅ Auth signup test passed');

      // Clean up test user (this will likely fail due to permissions, which is fine)
      try {
        await supabase.auth.admin.deleteUser(data.user.id);
        console.log('✅ Test user cleaned up');
      } catch (cleanupError) {
        console.log('ℹ️ Test user cleanup failed (expected due to permissions)');
      }

      return { success: true };

    } catch (error: any) {
      return {
        success: false,
        error: `Registration test failed: ${error.message}`
      };
    }
  }
}
