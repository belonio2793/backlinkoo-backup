import { supabase } from '@/integrations/supabase/client';

/**
 * Safe wrapper for Supabase queries that handles common database access errors gracefully
 */
export class SafeSupabaseQuery {
  /**
   * Safely query the profiles table with fallback handling
   */
  static async queryProfiles(query: any) {
    try {
      const result = await query;
      return result;
    } catch (error: any) {
      const errorMessage = error.message || error;
      
      if (errorMessage && (
        errorMessage.includes('permission denied') || 
        errorMessage.includes('relation') || 
        errorMessage.includes('does not exist') ||
        errorMessage.includes('JWT expired') ||
        errorMessage.includes('row-level security')
      )) {
        console.log('ℹ️ Database access limited - returning empty result for profiles query');
        return { data: null, error: null, count: 0 };
      }
      
      // Re-throw unexpected errors
      throw error;
    }
  }

  /**
   * Safely get user profile with fallback
   */
  static async getUserProfile(userId: string) {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        const errorMessage = error.message || error;
        
        if (errorMessage && (
          errorMessage.includes('permission denied') || 
          errorMessage.includes('relation') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('JWT expired') ||
          errorMessage.includes('row-level security')
        )) {
          console.log('ℹ️ Database access limited - returning minimal profile');
          return {
            data: {
              id: userId,
              user_id: userId,
              email: '',
              role: 'user' as const,
              subscription_tier: 'free' as const,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            },
            error: null
          };
        }
        
        return { data: null, error };
      }

      return { data: profile, error: null };
    } catch (error) {
      console.log('ℹ️ Database query failed - returning minimal profile');
      return {
        data: {
          id: userId,
          user_id: userId,
          email: '',
          role: 'user' as const,
          subscription_tier: 'free' as const,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        },
        error: null
      };
    }
  }

  /**
   * Safely check if profiles table is accessible
   */
  static async isProfilesTableAccessible(): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('profiles')
        .select('id')
        .limit(1);

      if (error) {
        const errorMessage = error.message || '';
        return !(
          errorMessage.includes('permission denied') || 
          errorMessage.includes('relation') || 
          errorMessage.includes('does not exist') ||
          errorMessage.includes('JWT expired') ||
          errorMessage.includes('row-level security')
        );
      }

      return true;
    } catch (error) {
      return false;
    }
  }
}
