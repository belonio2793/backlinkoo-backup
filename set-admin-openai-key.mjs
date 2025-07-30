// Set OpenAI API key in admin database
import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://dfhanacsmsvvkpunurnp.supabase.co';
const SUPABASE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRmaGFuYWNzbXN2dmtwdW51cm5wIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTI5NTY2NDcsImV4cCI6MjA2ODUzMjY0N30.MZcB4P_TAOOTktXSG7bNK5BsIMAf1bKXVgT87Zqa5RY';

const NEW_API_KEY = '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';

async function setApiKey() {
  console.log('🔧 Setting OpenAI API key in admin database...');
  
  const supabase = createClient(SUPABASE_URL, SUPABASE_KEY);
  
  try {
    const { data, error } = await supabase
      .from('admin_environment_variables')
      .upsert({
        key: 'VITE_OPENAI_API_KEY',
        value: NEW_API_KEY,
        description: 'OpenAI API key for AI content generation and backlink creation',
        is_secret: true
      }, {
        onConflict: 'key'
      });

    if (error) {
      console.error('❌ Error updating API key:', error);
      return;
    }

    console.log('✅ OpenAI API key successfully updated in admin database');

    // Verify the update
    const { data: verifyData, error: verifyError } = await supabase
      .from('admin_environment_variables')
      .select('value')
      .eq('key', 'VITE_OPENAI_API_KEY')
      .single();

    if (verifyError) {
      console.error('❌ Error verifying update:', verifyError);
      return;
    }

    console.log('🔍 Verified key preview:', verifyData.value ? verifyData.value.substring(0, 15) + '...' : 'Not found');
    
  } catch (error) {
    console.error('❌ Failed to update API key:', error);
  }
}

setApiKey();
