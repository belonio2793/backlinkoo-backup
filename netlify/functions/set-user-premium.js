const { createClient } = require('@supabase/supabase-js');

exports.handler = async (event, context) => {
  console.log('👑 Set User Premium Function Started');

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

    console.log('👑 Setting premium status for:', userEmail);

    // Step 1: Get user profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('user_id, email, subscription_tier')
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

    // Step 2: Update profile to premium
    const { error: updateError } = await supabase
      .from('profiles')
      .update({ subscription_tier: 'premium' })
      .eq('user_id', profile.user_id);

    if (updateError) {
      console.error('❌ Error updating profile:', updateError.message);
      return {
        statusCode: 500,
        body: JSON.stringify({
          error: 'Failed to update profile',
          details: updateError.message
        })
      };
    }

    // Step 3: Create premium subscription if doesn't exist
    const now = new Date();
    const periodEnd = new Date();
    periodEnd.setFullYear(periodEnd.getFullYear() + 1); // 1 year subscription

    const { error: subError } = await supabase
      .from('premium_subscriptions')
      .upsert({
        user_id: profile.user_id,
        plan_type: 'premium',
        status: 'active',
        current_period_start: now.toISOString(),
        current_period_end: periodEnd.toISOString()
      });

    if (subError) {
      console.warn('⚠️ Warning creating subscription:', subError.message);
    }

    console.log('✅ User set to premium successfully');

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'User premium status activated',
        user: {
          email: userEmail,
          userId: profile.user_id,
          previousTier: profile.subscription_tier,
          newTier: 'premium'
        }
      })
    };

  } catch (error) {
    console.error('❌ Error in set premium function:', error);
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
