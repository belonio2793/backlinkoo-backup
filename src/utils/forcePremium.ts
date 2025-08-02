import { supabase } from '@/integrations/supabase/client';

export async function forcePremiumStatus(userEmail: string) {
  try {
    console.log(`Setting ${userEmail} as premium user...`);

    // Find user by email using auth.admin if available, otherwise search profiles
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', userEmail)
      .single();

    if (profileError) {
      console.error('Error finding user profile:', profileError);
      return false;
    }

    if (!profiles) {
      console.error(`User with email ${userEmail} not found`);
      return false;
    }

    const userId = profiles.id;
    console.log(`Found user: ${userId}`);

    // Check for existing subscription
    const { data: existingSub, error: subCheckError } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', userId)
      .single();

    const currentDate = new Date();
    const periodStart = currentDate.toISOString();
    const periodEnd = new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString();

    if (existingSub && !subCheckError) {
      // Update existing subscription
      const { error: updateError } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: currentDate.toISOString()
        })
        .eq('user_id', userId);

      if (updateError) {
        console.error('Error updating subscription:', updateError);
        return false;
      }
      console.log('Updated existing subscription');
    } else {
      // Create new subscription
      const { error: insertError } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: userId,
          plan_type: 'premium',
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd
        });

      if (insertError) {
        console.error('Error creating subscription:', insertError);
        return false;
      }
      console.log('Created new premium subscription');
    }

    return true;
  } catch (error) {
    console.error('Unexpected error:', error);
    return false;
  }
}
