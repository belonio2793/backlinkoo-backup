import { supabase } from '@/integrations/supabase/client';
import { SafeAuth } from '@/utils/safeAuth';

export interface CreateUserPayload {
  email: string;
  password: string;
  display_name?: string;
  role?: 'user' | 'admin';
  auto_confirm?: boolean;
}

export interface CreateUserResult {
  success: boolean;
  user?: any;
  profile?: any;
  error?: string;
}

class AdminUserCreationService {
  
  /**
   * Create a new user in the system (admin only)
   */
  async createUser(payload: CreateUserPayload): Promise<CreateUserResult> {
    try {
      console.log('🔨 Creating new user:', payload.email);
      
      // Check if current user is admin
      const adminCheck = await SafeAuth.isAdmin();
      if (!adminCheck.isAdmin || adminCheck.needsAuth) {
        return {
          success: false,
          error: 'Admin access required to create users'
        };
      }
      
      // Validate input
      if (!payload.email || !payload.password) {
        return {
          success: false,
          error: 'Email and password are required'
        };
      }
      
      if (payload.password.length < 6) {
        return {
          success: false,
          error: 'Password must be at least 6 characters long'
        };
      }
      
      // Check if user already exists
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', payload.email.toLowerCase().trim())
        .single();
      
      if (existingProfile) {
        return {
          success: false,
          error: 'A user with this email already exists'
        };
      }
      
      console.log('✅ Email validation passed, creating user via admin function...');

      try {
        // Try using Netlify function for user creation (requires service role key)
        const response = await fetch('/.netlify/functions/create-admin-user', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: payload.email.toLowerCase().trim(),
            password: payload.password,
            display_name: payload.display_name || null,
            role: payload.role || 'user',
            auto_confirm: payload.auto_confirm || true
          })
        });

        if (response.ok) {
          const result = await response.json();

          if (result.success) {
            console.log('✅ User created successfully via admin function');
            return {
              success: true,
              user: result.user,
              profile: result.profile
            };
          } else {
            throw new Error(result.error || 'Admin function returned error');
          }
        } else {
          const errorData = await response.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${response.status}: ${response.statusText}`);
        }

      } catch (adminError: any) {
        console.warn('⚠️ Admin function failed, trying fallback method:', adminError.message);

        // Fallback: Try direct client-side user creation (may not work without service role)
        try {
          const { data: authData, error: authError } = await supabase.auth.admin.createUser({
            email: payload.email.toLowerCase().trim(),
            password: payload.password,
            email_confirm: payload.auto_confirm || true,
            user_metadata: {
              display_name: payload.display_name || null
            }
          });

          if (authError) {
            throw new Error(`Auth user creation failed: ${authError.message}`);
          }

          if (!authData.user) {
            throw new Error('Auth user creation returned no user data');
          }

          console.log('✅ Auth user created via fallback:', authData.user.id);

          // Create the profile
          const profileData = {
            user_id: authData.user.id,
            email: payload.email.toLowerCase().trim(),
            display_name: payload.display_name || null,
            role: payload.role || 'user',
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          };

          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .insert(profileData)
            .select()
            .single();

          if (profileError) {
            // Try to clean up the auth user if profile creation failed
            try {
              await supabase.auth.admin.deleteUser(authData.user.id);
              console.log('🧹 Cleaned up auth user after profile creation failure');
            } catch (cleanupError) {
              console.warn('⚠️ Could not clean up auth user:', cleanupError);
            }

            throw new Error(`Profile creation failed: ${profileError.message}`);
          }

          console.log('✅ User profile created successfully via fallback');

          return {
            success: true,
            user: authData.user,
            profile: profile
          };

        } catch (fallbackError: any) {
          console.error('❌ Fallback method also failed:', fallbackError.message);
          return {
            success: false,
            error: `User creation failed. Admin function error: ${adminError.message}. Fallback error: ${fallbackError.message}. Please ensure SUPABASE_SERVICE_ROLE_KEY is configured in Netlify environment variables.`
          };
        }
      }
      
    } catch (error: any) {
      console.error('❌ User creation failed:', error);
      return {
        success: false,
        error: `User creation failed: ${error.message}`
      };
    }
  }
  
  /**
   * Check if email is available for new user
   */
  async checkEmailAvailable(email: string): Promise<{ available: boolean; error?: string }> {
    try {
      if (!email) {
        return { available: false, error: 'Email is required' };
      }
      
      const { data: existingProfile, error } = await supabase
        .from('profiles')
        .select('email')
        .eq('email', email.toLowerCase().trim())
        .single();
      
      if (error && error.code === 'PGRST116') {
        // Not found - email is available
        return { available: true };
      }
      
      if (error) {
        return { available: false, error: error.message };
      }
      
      // Email exists
      return { available: false, error: 'Email already in use' };
      
    } catch (error: any) {
      return { available: false, error: error.message };
    }
  }
  
  /**
   * Generate a random password
   */
  generateRandomPassword(length: number = 12): string {
    const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
    let password = '';
    
    for (let i = 0; i < length; i++) {
      password += charset.charAt(Math.floor(Math.random() * charset.length));
    }
    
    return password;
  }
}

export const adminUserCreationService = new AdminUserCreationService();
