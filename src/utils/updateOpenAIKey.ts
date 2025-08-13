/**
 * Update OpenAI API Key Everywhere
 * Updates the API key in all configuration sources
 */

import { supabase } from '@/integrations/supabase/client';
import { adminGlobalSync } from '@/services/adminGlobalConfigSync';

export async function updateOpenAIKeyEverywhere() {
  // SECURITY: API keys should NEVER be hardcoded in client-side code
  console.log('⚠️ This function should not contain hardcoded API keys');

  try {
    // 1. Update in admin_environment_variables table
    const { error: dbError } = await supabase
      .from('admin_environment_variables')
      .upsert({
        key: 'VITE_OPENAI_API_KEY',
        value: newApiKey,
        description: 'OpenAI API key for AI content generation and backlink creation',
        is_secret: true
      }, { onConflict: 'key' });

    if (dbError) {
      console.error('❌ Failed to update database:', dbError);
    } else {
      console.log('✅ Updated database successfully');
    }

    // 2. Update via global sync service
    try {
      await adminGlobalSync.saveAdminConfig('VITE_OPENAI_API_KEY', newApiKey);
      console.log('✅ Updated global sync service');
    } catch (syncError) {
      console.error('❌ Failed to update global sync:', syncError);
    }

    // 3. Update localStorage as fallback
    try {
      const existingEnvVars = JSON.parse(localStorage.getItem('admin_env_vars') || '[]');
      const updatedEnvVars = existingEnvVars.filter((item: any) => item.key !== 'VITE_OPENAI_API_KEY');
      updatedEnvVars.push({
        key: 'VITE_OPENAI_API_KEY',
        value: newApiKey,
        description: 'OpenAI API key for AI content generation and backlink creation',
        is_secret: true
      });
      localStorage.setItem('admin_env_vars', JSON.stringify(updatedEnvVars));
      console.log('✅ Updated localStorage fallback');
    } catch (localError) {
      console.error('❌ Failed to update localStorage:', localError);
    }

    // 4. Test the API key
    try {
      const testResponse = await fetch('https://api.openai.com/v1/models', {
        headers: {
          'Authorization': `Bearer ${newApiKey}`,
          'Content-Type': 'application/json'
        }
      });

      if (testResponse.ok) {
        console.log('✅ API key test: SUCCESS - OpenAI API is working');
        return { success: true, message: 'OpenAI API key updated and tested successfully!' };
      } else {
        console.warn('⚠️ API key test: FAILED - Response:', testResponse.status);
        return { success: false, message: 'API key updated but test failed. Please check the key.' };
      }
    } catch (testError) {
      console.warn('⚠️ Could not test API key:', testError);
      return { success: true, message: 'API key updated (could not test connectivity)' };
    }

  } catch (error) {
    console.error('❌ Error updating OpenAI API key:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Unknown error' };
  }
}
