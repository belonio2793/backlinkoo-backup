import { supabase } from "@/integrations/supabase/client";

/**
 * Service to handle profile migration for existing users who might be missing profile data
 */
export class ProfileMigrationService {
  
  /**
   * Ensures a user has a proper profile record with display_name
   */
  static async ensureUserProfile(userId: string, email: string, userMetadata?: any): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if profile exists
      const { data: existingProfile, error: fetchError } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (fetchError && fetchError.code !== 'PGRST116') {
        // Real error, not just "no rows returned"
        console.error('Error fetching profile:', fetchError.message || fetchError);
        return { success: false, error: fetchError.message };
      }

      const displayName = this.extractDisplayName(userMetadata, email);

      if (!existingProfile) {
        // Profile doesn't exist, create it
        const { error: insertError } = await supabase
          .from('profiles')
          .insert({
            user_id: userId,
            email: email,
            display_name: displayName,
            role: 'user'
          });

        if (insertError) {
          console.error('Error creating profile:', insertError.message || insertError);
          return { success: false, error: insertError.message };
        }

        console.log('Profile created for user:', userId);
        return { success: true };

      } else if (!existingProfile.display_name) {
        // Profile exists but missing display_name
        const { error: updateError } = await supabase
          .from('profiles')
          .update({
            display_name: displayName
          })
          .eq('user_id', userId);

        if (updateError) {
          console.error('Error updating profile display_name:', updateError.message || updateError);
          return { success: false, error: updateError.message };
        }

        console.log('Profile display_name updated for user:', userId);
        return { success: true };
      }

      // Profile exists and is complete
      return { success: true };

    } catch (error: any) {
      console.error('Profile migration error:', error.message || error);
      return { success: false, error: error.message || 'Unknown error' };
    }
  }

  /**
   * Extracts a suitable display name from various sources
   */
  private static extractDisplayName(userMetadata: any, email: string): string {
    // Try to get name from metadata in order of preference
    if (userMetadata?.first_name) {
      return userMetadata.first_name.trim();
    }
    
    if (userMetadata?.display_name) {
      return userMetadata.display_name.trim();
    }

    if (userMetadata?.full_name) {
      return userMetadata.full_name.trim();
    }

    if (userMetadata?.name) {
      return userMetadata.name.trim();
    }

    // Fallback to email username
    if (email) {
      const emailUsername = email.split('@')[0];
      return emailUsername.charAt(0).toUpperCase() + emailUsername.slice(1);
    }

    // Final fallback
    return 'User';
  }

  /**
   * Bulk migration function to fix profiles for all users (admin use)
   */
  static async migrateAllUserProfiles(): Promise<{ 
    processed: number; 
    fixed: number; 
    errors: string[] 
  }> {
    const result = {
      processed: 0,
      fixed: 0,
      errors: [] as string[]
    };

    try {
      // This would require admin privileges and should be run carefully
      console.log('Bulk profile migration should be run by admin with proper authentication');
      
      // For safety, this method only logs what it would do
      console.log('This is a placeholder for bulk migration. Implement with admin authentication.');
      
      return result;
    } catch (error: any) {
      result.errors.push(error.message);
      return result;
    }
  }

  /**
   * Validates if a user has a complete profile
   */
  static async validateUserProfile(userId: string): Promise<{
    isValid: boolean;
    missingFields: string[];
    profile?: any;
  }> {
    try {
      const { data: profile, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        return {
          isValid: false,
          missingFields: ['entire_profile'],
          profile: null
        };
      }

      const missingFields: string[] = [];
      
      if (!profile.display_name) {
        missingFields.push('display_name');
      }
      
      if (!profile.email) {
        missingFields.push('email');
      }

      return {
        isValid: missingFields.length === 0,
        missingFields,
        profile
      };

    } catch (error: any) {
      return {
        isValid: false,
        missingFields: ['validation_error'],
        profile: null
      };
    }
  }
}
