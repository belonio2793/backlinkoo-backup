/**
 * Auto Admin Setup Utility
 * 
 * Automatically creates the admin user if it doesn't exist
 * This runs on app startup to ensure admin access is always available
 */

import { supabase } from '@/integrations/supabase/client';

let setupAttempted = false;

export async function autoSetupAdmin() {
  // Only attempt setup once per session
  if (setupAttempted) return;
  setupAttempted = true;

  try {
    console.log('🔧 Checking admin user setup...');

    // Check if admin user already exists
    const { data: existingProfile } = await supabase
      .from('profiles')
      .select('role, email')
      .eq('email', 'support@backlinkoo.com')
      .single();

    if (existingProfile?.role === 'admin') {
      console.log('✅ Admin user already exists');
      return { success: true, message: 'Admin user exists' };
    }

    console.log('👤 Admin user not found, creating...');

    // Try to create admin user
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email: 'support@backlinkoo.com',
      password: 'Admin123!@#',
      options: {
        data: {
          full_name: 'Support Admin',
          display_name: 'Support Team'
        }
      }
    });

    let userId: string | undefined;

    if (signUpError) {
      if (signUpError.message.includes('already registered')) {
        console.log('👤 User exists in auth, finding user...');
        
        // User exists, try to get the user ID
        const { data: signInData } = await supabase.auth.signInWithPassword({
          email: 'support@backlinkoo.com',
          password: 'Admin123!@#'
        });

        if (signInData.user) {
          userId = signInData.user.id;
          // Sign out immediately
          await supabase.auth.signOut();
        }
      } else {
        console.warn('Could not create admin user:', signUpError.message);
        return { success: false, error: signUpError.message };
      }
    } else {
      userId = signUpData.user?.id;
    }

    if (!userId) {
      console.warn('Could not get user ID for admin user');
      return { success: false, error: 'Could not get user ID' };
    }

    // Create or update the admin profile
    const { error: profileError } = await supabase
      .from('profiles')
      .upsert({
        user_id: userId,
        email: 'support@backlinkoo.com',
        full_name: 'Support Admin',
        display_name: 'Support Team',
        role: 'admin',
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'user_id'
      });

    if (profileError) {
      console.warn('Could not create admin profile:', profileError.message);
      return { success: false, error: profileError.message };
    }

    console.log('✅ Admin user setup completed successfully');
    return { success: true, message: 'Admin user created' };

  } catch (error: any) {
    console.warn('Admin setup failed:', error.message);
    return { success: false, error: error.message };
  }
}

// Auto-run on import in development
if (import.meta.env.DEV) {
  // Run after a short delay to allow app to initialize
  setTimeout(() => {
    autoSetupAdmin().then(result => {
      if (result.success) {
        console.log('🎉 Admin user is ready for use');
      }
    });
  }, 2000);
}

export default autoSetupAdmin;
