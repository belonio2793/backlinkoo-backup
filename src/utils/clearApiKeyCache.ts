/**
 * Immediate cache clearing utility for API keys
 * SECURITY: This file has been cleaned of hardcoded API keys
 */

export function clearAllApiKeyCaches(): void {
  console.log('🧹 Clearing ALL API key caches...');
  
  // Clear localStorage items that might contain old API keys
  const keysToRemove = [
    'admin_api_configurations',
    'permanent_api_configs', 
    'temp_openai_key',
    'admin_env_vars',
    'openai_key_invalid',
    'openai_config_cache',
    'api_key_cache',
    'environment_variables_cache'
  ];
  
  keysToRemove.forEach(key => {
    if (localStorage.getItem(key)) {
      localStorage.removeItem(key);
      console.log(`🗑️ Removed localStorage key: ${key}`);
    }
  });
  
  // Clear sessionStorage as well
  const sessionKeys = [
    'openai_api_key',
    'api_configurations',
    'temp_api_keys'
  ];
  
  sessionKeys.forEach(key => {
    if (sessionStorage.getItem(key)) {
      sessionStorage.removeItem(key);
      console.log(`🗑️ Removed sessionStorage key: ${key}`);
    }
  });
  
  console.log('✅ All API key caches cleared');
}

export function setCorrectApiKey(): void {
  // SECURITY: API keys should NEVER be hardcoded in client-side code
  console.warn('⚠️ This function has been disabled for security reasons');
  console.warn('🔒 API keys should be configured through secure environment variables only');
  
  // Clear any existing cached API keys instead of setting hardcoded ones
  clearAllApiKeyCaches();
  
  throw new Error('API keys must be provided through secure environment variables, not hardcoded');
}

// Functions available for manual execution - don't auto-run to prevent side effects
// Call clearAllApiKeyCaches() manually when needed to clear caches
