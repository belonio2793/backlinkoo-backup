/**
 * Utility to set OpenAI API key in the admin environment variables database
 * SECURITY: This file has been cleaned of hardcoded API keys
 */

import { environmentVariablesService } from '@/services/environmentVariablesService';

export async function setDefaultOpenAIKey(): Promise<boolean> {
  // SECURITY: API keys should NEVER be hardcoded in client-side code
  console.warn('⚠️ This function has been disabled for security reasons');
  console.warn('🔒 API keys should be configured through secure environment variables only');
  
  return false;
}

// Export for use in other components
export { setDefaultOpenAIKey as setOpenAIKey };
