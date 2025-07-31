/**
 * Utility to set OpenAI API key in the admin environment variables database
 */

import { environmentVariablesService } from '@/services/environmentVariablesService';

export async function setDefaultOpenAIKey(): Promise<boolean> {
  const NEW_OPENAI_API_KEY = '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';
  
  try {
    console.log('🔄 Setting OpenAI API key in database...');
    
    const success = await environmentVariablesService.saveVariable(
      'VITE_OPENAI_API_KEY',
      NEW_OPENAI_API_KEY,
      'OpenAI API key for AI content generation and blog creation - GLOBAL CONFIGURATION',
      true
    );

    if (success) {
      console.log('✅ OpenAI API key set successfully in database!');
      console.log('🔑 Key preview:', NEW_OPENAI_API_KEY.substring(0, 15) + '...');
      
      // Force refresh the cache
      await environmentVariablesService.refreshCache();
      
      // Test the key
      const isConfigured = await environmentVariablesService.isOpenAIConfigured();
      console.log('🧪 OpenAI configuration status:', isConfigured ? 'Configured' : 'Not configured');
      
      return true;
    } else {
      console.error('❌ Failed to save OpenAI API key to database');
      return false;
    }
  } catch (error) {
    console.error('❌ Error setting OpenAI API key:', error);
    return false;
  }
}

// Export for use in other components
export { setDefaultOpenAIKey as setOpenAIKey };
