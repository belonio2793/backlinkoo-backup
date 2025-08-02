#!/usr/bin/env node

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY // This needs admin privileges
);

async function setPremiumUser(email) {
  try {
    console.log(`Setting ${email} as premium user...`);

    // Step 1: Find the user by email
    const { data: users, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('Error fetching users:', userError.message || userError);
      return;
    }

    const user = users.users.find(u => u.email === email);
    
    if (!user) {
      console.error(`User with email ${email} not found`);
      return;
    }

    console.log(`Found user: ${user.id}`);

    // Step 2: Check if premium subscription already exists
    const { data: existingSub, error: subCheckError } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', user.id)
      .single();

    if (subCheckError && subCheckError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('Error checking existing subscription:', subCheckError.message || subCheckError);
      return;
    }

    // Step 3: Create or update premium subscription
    const currentDate = new Date();
    const periodStart = currentDate.toISOString();
    const periodEnd = new Date(currentDate.getTime() + (365 * 24 * 60 * 60 * 1000)).toISOString(); // 1 year from now

    let result;
    if (existingSub) {
      // Update existing subscription
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .update({
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd,
          updated_at: currentDate.toISOString()
        })
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        console.error('Error updating subscription:', error.message || error);
        return;
      }
      
      result = data;
      console.log('Updated existing subscription');
    } else {
      // Create new subscription
      const { data, error } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: user.id,
          plan_type: 'premium',
          status: 'active',
          current_period_start: periodStart,
          current_period_end: periodEnd
        })
        .select()
        .single();

      if (error) {
        console.error('Error creating subscription:', error.message || error);
        return;
      }
      
      result = data;
      console.log('Created new premium subscription');
    }

    console.log('Success! Premium subscription details:', {
      user_id: result.user_id,
      status: result.status,
      plan_type: result.plan_type,
      current_period_start: result.current_period_start,
      current_period_end: result.current_period_end
    });

    // Step 4: Verify the premium status
    const { data: verification, error: verifyError } = await supabase
      .rpc('is_premium_user', { user_uuid: user.id });

    if (verifyError) {
      console.error('Error verifying premium status:', verifyError.message || verifyError);
    } else {
      console.log(`Premium status verification: ${verification ? 'ACTIVE' : 'INACTIVE'}`);
    }

  } catch (error) {
    console.error('Unexpected error:', error.message || error);
  }
}

// Get email from command line argument
const email = process.argv[2];

if (!email) {
  console.error('Usage: node set-premium-user.js <email>');
  console.error('Example: node set-premium-user.js labindalawamaryrose@gmail.com');
  process.exit(1);
}

setPremiumUser(email);
