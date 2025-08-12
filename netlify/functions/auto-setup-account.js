const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

exports.handler = async (event, context) => {
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Content-Type': 'application/json'
  };

  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 200, headers };
  }

  try {
    const { userId, userEmail, userName } = JSON.parse(event.body || '{}');
    
    if (!userId || !userEmail) {
      return {
        statusCode: 400,
        headers,
        body: JSON.stringify({ error: 'User ID and email required' })
      };
    }

    // Check if user already has a posting account
    const { data: existingAccount } = await supabase
      .from('posting_accounts')
      .select('id')
      .eq('user_id', userId)
      .limit(1)
      .single();

    if (existingAccount) {
      return {
        statusCode: 200,
        headers,
        body: JSON.stringify({ 
          success: true, 
          message: 'Account already exists',
          accountId: existingAccount.id 
        })
      };
    }

    // Create default posting account
    const accountData = {
      user_id: userId,
      name: userName || userEmail.split('@')[0], // Use name from email if no name provided
      email: userEmail,
      website: '', // Will be set to campaign target URL when posting
      platform: 'generic',
      is_active: true,
      health_score: 100
    };

    const { data: newAccount, error } = await supabase
      .from('posting_accounts')
      .insert([accountData])
      .select()
      .single();

    if (error) {
      throw error;
    }

    return {
      statusCode: 200,
      headers,
      body: JSON.stringify({
        success: true,
        message: 'Default posting account created',
        accountId: newAccount.id
      })
    };

  } catch (error) {
    console.error('Auto-setup account error:', error);
    return {
      statusCode: 500,
      headers,
      body: JSON.stringify({ 
        error: error.message,
        success: false 
      })
    };
  }
};
