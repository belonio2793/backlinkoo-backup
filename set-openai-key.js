/**
 * Script to set the default OpenAI API key in the admin environment variables
 */

import { createClient } from '@supabase/supabase-js';

// Get Supabase credentials from environment
const supabaseUrl = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzQ1NDk0MzksImV4cCI6MjA1MDEyNTQzOX0.yLyV3D9L0xPgczBgHdH6iIu6Q5lhNtU6eGx0a6CwH_Q';

// New OpenAI API key to set
const NEW_OPENAI_API_KEY = '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';

async function updateOpenAIKey() {
  try {
    console.log('🔄 Connecting to Supabase...');
    
    const supabase = createClient(supabaseUrl, supabaseKey);
    
    console.log('🔄 Updating OpenAI API key...');
    
    // Upsert the OpenAI API key in the admin_environment_variables table
    const { error } = await supabase
      .from('admin_environment_variables')
      .upsert({
        key: 'VITE_OPENAI_API_KEY',
        value: NEW_OPENAI_API_KEY,
        description: 'OpenAI API key for AI content generation and blog creation - GLOBAL CONFIGURATION',
        is_secret: true
      });

    if (error) {
      console.error('❌ Error updating OpenAI API key:', error);
      return false;
    }

    console.log('✅ OpenAI API key updated successfully!');
    console.log('🔑 Key preview:', NEW_OPENAI_API_KEY.substring(0, 15) + '...');
    
    // Test the key
    console.log('🧪 Testing API key...');
    try {
      const response = await fetch('https://api.openai.com/v1/models', {
        headers: { 'Authorization': `Bearer ${NEW_OPENAI_API_KEY}` },
        method: 'GET'
      });

      if (response.ok) {
        console.log('✅ API key test successful!');
      } else {
        console.log('⚠️ API key test failed with status:', response.status);
      }
    } catch (testError) {
      console.log('⚠️ API key test failed:', testError.message);
    }
    
    return true;
  } catch (error) {
    console.error('❌ Failed to update OpenAI API key:', error);
    return false;
  }
}

// Run the update
updateOpenAIKey().then(success => {
  if (success) {
    console.log('\n🎉 OpenAI API key has been set as the default across all settings!');
    console.log('📌 The key will now be used for all AI features in the application.');
  } else {
    console.log('\n❌ Failed to set the OpenAI API key. Please check the logs above.');
  }
});
