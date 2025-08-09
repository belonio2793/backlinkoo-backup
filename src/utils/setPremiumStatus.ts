import { supabase } from '@/integrations/supabase/client';

export async function setPremiumStatus(email: string = 'labindalawamaryrose@gmail.com'): Promise<{ success: boolean; message: string }> {
  try {
    console.log('🔧 Setting premium status for:', email);
    
    // Get current user
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user) {
      return { success: false, message: 'No authenticated user' };
    }
    
    if (user.email !== email) {
      return { success: false, message: `Current user (${user.email}) doesn't match target email (${email})` };
    }
    
    console.log('👤 Current user verified:', user.email);
    
    // Check if profile exists
    const { data: existingProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (fetchError && fetchError.code !== 'PGRST116') {
      console.log('❌ Error fetching profile:', fetchError.message);
      return { success: false, message: `Database error: ${fetchError.message}` };
    }
    
    console.log('📊 Current profile:', existingProfile);
    
    let updateResult;
    
    if (!existingProfile) {
      // Create new premium profile
      console.log('🆕 Creating new premium profile...');
      updateResult = await supabase
        .from('profiles')
        .insert({
          user_id: user.id,
          role: 'premium',
          subscription_status: 'active',
          subscription_tier: 'premium',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        });
    } else {
      // Update existing profile to premium
      console.log('⬆️ Updating existing profile to premium...');
      updateResult = await supabase
        .from('profiles')
        .update({
          role: 'premium',
          subscription_status: 'active',
          subscription_tier: 'premium',
          updated_at: new Date().toISOString()
        })
        .eq('user_id', user.id);
    }
    
    if (updateResult.error) {
      console.log('❌ Update error:', updateResult.error.message);
      return { success: false, message: `Failed to set premium status: ${updateResult.error.message}` };
    }
    
    console.log('✅ Premium status set successfully');
    return { success: true, message: 'Successfully set premium status' };
    
  } catch (error: any) {
    console.error('❌ Exception in setPremiumStatus:', error.message || error);
    return { success: false, message: `Unexpected error: ${error.message}` };
  }
}

// Make available globally for testing
(window as any).setPremiumStatus = setPremiumStatus;
