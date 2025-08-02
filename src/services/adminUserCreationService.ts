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

      // Use Netlify function for user creation (requires service role key)
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

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        console.error('❌ Admin function failed:', errorData);
        return {
          success: false,
          error: errorData.error || `HTTP ${response.status}: ${response.statusText}`
        };
      }

      const result = await response.json();

      if (!result.success) {
        return {
          success: false,
          error: result.error || 'User creation failed'
        };
      }

      console.log('✅ User created successfully via admin function');

      return {
        success: true,
        user: result.user,
        profile: result.profile
      };
      
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
