// Temporary utility to set OpenAI API key in admin database
import { environmentVariablesService } from './src/services/environmentVariablesService.js';

const NEW_API_KEY = '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';

async function setAdminApiKey() {
  console.log('🔧 Setting OpenAI API key in admin database...');
  
  try {
    const success = await environmentVariablesService.saveVariable(
      'VITE_OPENAI_API_KEY',
      NEW_API_KEY,
      'OpenAI API key for AI content generation and backlink creation',
      true
    );
    
    if (success) {
      console.log('✅ OpenAI API key successfully saved to admin database');
      
      // Clear cache to force refresh
      environmentVariablesService.clearCache();
      
      // Test retrieval
      const retrievedKey = await environmentVariablesService.getVariable('VITE_OPENAI_API_KEY');
      console.log('🔍 Retrieved key preview:', retrievedKey ? retrievedKey.substring(0, 15) + '...' : 'Not found');
      
    } else {
      console.error('❌ Failed to save OpenAI API key to admin database');
    }
  } catch (error) {
    console.error('❌ Error setting admin API key:', error);
  }
}

setAdminApiKey();
