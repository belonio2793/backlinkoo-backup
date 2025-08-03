import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ProfileMigrationService } from '@/services/profileMigrationService';
import { useToast } from '@/hooks/use-toast';

interface AuthProfileCheckerProps {
  children: React.ReactNode;
}

/**
 * Component that ensures authenticated users have proper profile data
 * Runs profile migration if needed when user is authenticated
 */
export const AuthProfileChecker = ({ children }: AuthProfileCheckerProps) => {
  const [isChecking, setIsChecking] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    const checkUserProfile = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session?.user) {
          // User is authenticated, check their profile
          const validation = await ProfileMigrationService.validateUserProfile(session.user.id);
          
          if (!validation.isValid) {
            console.log('User profile needs migration:', validation.missingFields);
            
            // Attempt to fix the profile
            const migrationResult = await ProfileMigrationService.ensureUserProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata
            );
            
            if (migrationResult.success) {
              console.log('Profile migration completed successfully');
            } else {
              console.warn('Profile migration failed:', migrationResult.error);
              // Don't show error to user unless it's critical
            }
          }
        }
      } catch (error: any) {
        const errorMessage = error?.message || error;

        // Suppress known permission errors that don't affect functionality
        if (errorMessage && errorMessage.includes('permission denied for table users')) {
          console.log('ℹ️ Skipping profile check due to database permission configuration');
        } else {
          console.warn('Profile check error:', errorMessage);
        }
        // Don't block app loading for profile check errors
      } finally {
        setIsChecking(false);
      }
    };

    checkUserProfile();

    // Listen for auth state changes to check profiles of newly logged in users
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        // Run profile check for newly signed in users
        try {
          const validation = await ProfileMigrationService.validateUserProfile(session.user.id);
          
          if (!validation.isValid) {
            const migrationResult = await ProfileMigrationService.ensureUserProfile(
              session.user.id,
              session.user.email || '',
              session.user.user_metadata
            );
            
            if (!migrationResult.success) {
              console.warn('Profile migration failed for new login:', migrationResult.error);
            }
          }
        } catch (error: any) {
          const errorMessage = error?.message || error;

          // Suppress known permission errors that don't affect functionality
          if (errorMessage && errorMessage.includes('permission denied for table users')) {
            console.log('ℹ️ Skipping profile check on auth change due to database permission configuration');
          } else {
            console.warn('Profile check error on auth change:', errorMessage);
          }
        }
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  // Don't block app loading for profile checks
  return <>{children}</>;
};
