const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('🔄 Premium Status Sync Function Started');

  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    };
  }

  try {
    const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://dfhanacsmsvvkpunurnp.supabase.co';
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!serviceRoleKey) {
      return {
        statusCode: 500,
        body: JSON.stringify({ 
          error: 'Service configuration missing',
          message: 'Service role key required for database operations'
        })
      };
    }

    const supabase = createClient(supabaseUrl, serviceRoleKey);
    const { userEmail } = JSON.parse(event.body || '{}');

    if (!userEmail) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'User email is required' })
      };
    }

    console.log('🔍 Checking subscription status for:', userEmail);

    // Step 1: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, subscription_tier, role')
      .eq('email', userEmail)
      .single();

    if (profileError) {
      console.error('❌ Profile query error:', profileError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to fetch user profile',
          details: profileError.message
        })
      };
    }

    console.log('📋 User profile:', profile);

    // Step 2: Check premium_subscriptions table
    const { data: premiumSubs, error: subError } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', profile.user_id);

    if (subError) {
      console.warn('⚠️ Premium subscriptions query error:', subError.message);
    }

    console.log('💎 Premium subscriptions:', premiumSubs);

    // Step 3: Determine if user should be premium
    const shouldBePremium = profile.subscription_tier === 'premium' || 
                           profile.subscription_tier === 'monthly' ||
                           (premiumSubs && premiumSubs.length > 0 && 
                            premiumSubs.some(sub => sub.status === 'active'));

    console.log('🎯 Should be premium:', shouldBePremium);

    // Step 4: If user should be premium but doesn't have active subscription, create one
    if (shouldBePremium && (!premiumSubs || premiumSubs.length === 0)) {
      console.log('🔧 Creating missing premium subscription...');
      
      const now = new Date();
      const periodEnd = new Date();
      periodEnd.setFullYear(periodEnd.getFullYear() + 1); // 1 year subscription

      const { data: newSub, error: createError } = await supabase
        .from('premium_subscriptions')
        .insert({
          user_id: profile.user_id,
          plan_type: 'premium',
          status: 'active',
          current_period_start: now.toISOString(),
          current_period_end: periodEnd.toISOString()
        })
        .select()
        .single();

      if (createError) {
        console.error('❌ Error creating subscription:', createError.message);
      } else {
        console.log('✅ Created premium subscription:', newSub);
      }
    }

    // Step 5: If user has subscription but profile tier is wrong, update profile
    if (shouldBePremium && profile.subscription_tier !== 'premium') {
      console.log('🔧 Updating profile subscription tier...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ subscription_tier: 'premium' })
        .eq('user_id', profile.user_id);

      if (updateError) {
        console.error('❌ Error updating profile:', updateError.message);
      } else {
        console.log('✅ Updated profile subscription tier to premium');
      }
    }

    // Step 6: Get final status
    const { data: finalProfile } = await supabase
      .from('profiles')
      .select('subscription_tier')
      .eq('user_id', profile.user_id)
      .single();

    const { data: finalSubs } = await supabase
      .from('premium_subscriptions')
      .select('*')
      .eq('user_id', profile.user_id)
      .eq('status', 'active');

    const finalStatus = {
      isPremium: (finalProfile?.subscription_tier === 'premium' || finalProfile?.subscription_tier === 'monthly') &&
                 finalSubs && finalSubs.length > 0,
      profileTier: finalProfile?.subscription_tier,
      activeSubscriptions: finalSubs?.length || 0
    };

    console.log('🏁 Final status:', finalStatus);

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Premium status synchronized',
        before: {
          profileTier: profile.subscription_tier,
          premiumSubsCount: premiumSubs?.length || 0
        },
        after: finalStatus,
        actions: [
          shouldBePremium && (!premiumSubs || premiumSubs.length === 0) ? 'Created premium subscription' : null,
          shouldBePremium && profile.subscription_tier !== 'premium' ? 'Updated profile tier' : null
        ].filter(Boolean)
      })
    };

  } catch (error) {
    console.error('❌ Error in sync function:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({
        success: false,
        error: 'Function execution failed',
        details: error.message
      })
    };
  }
};
