import { supabase } from '@/integrations/supabase/client';

export async function fixSignupTrigger(): Promise<{ success: boolean; error?: string }> {
  try {
    console.log('🔧 Fixing handle_new_user trigger function...');

    // First, let's check what's causing the issue by trying to create a test user profile manually
    const testResult = await supabase
      .from('profiles')
      .select('user_id, email, role')
      .limit(1);

    if (testResult.error) {
      return {
        success: false,
        error: `Cannot access profiles table: ${testResult.error.message}`
      };
    }

    console.log('✅ Profiles table is accessible');

    // Check if user_roles table exists (this might be causing the issue)
    const userRolesTest = await supabase
      .from('user_roles')
      .select('user_id, role')
      .limit(1);

    if (userRolesTest.error) {
      console.warn('⚠️ User_roles table issue:', userRolesTest.error.message);
      console.log('🔧 This is likely the cause of signup failures - the trigger is trying to insert into user_roles table that may not exist or be accessible');
    }

    // The fix would require admin SQL access which we don't have from the client
    // Instead, let's provide instructions for manual fix
    return {
      success: false,
      error: `
MANUAL FIX REQUIRED:

The signup issue is caused by the handle_new_user() trigger function trying to insert into a user_roles table that may not exist or be accessible.

To fix this, you need to run this SQL in your Supabase SQL editor:

1. Go to your Supabase dashboard
2. Navigate to SQL Editor
3. Run the SQL commands from the file: fix_signup_trigger.sql

This will update the trigger function to work with your current database schema.

Alternatively, you can disable the trigger temporarily:
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;

And handle profile creation manually in your application code.
      `
    };

  } catch (error: any) {
    return {
      success: false,
      error: `Failed to diagnose trigger issue: ${error.message}`
    };
  }
}
