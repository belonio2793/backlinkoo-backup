/**
 * Immediate cache clearing utility for API keys
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
  const CORRECT_KEY = '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';
  
  console.log('🔑 Setting correct API key ending with:', CORRECT_KEY.slice(-4));
  
  // Set in localStorage for the admin configuration
  const adminConfig = [{
    service: 'OpenAI',
    apiKey: CORRECT_KEY,
    isActive: true,
    lastTested: new Date().toISOString(),
    isValid: true
  }];
  
  localStorage.setItem('admin_api_configurations', JSON.stringify(adminConfig));
  
  // Set as permanent config
  const permanentConfig = [{
    service: 'OpenAI',
    apiKey: CORRECT_KEY,
    isActive: true,
    lastUpdated: new Date().toISOString()
  }];
  
  localStorage.setItem('permanent_api_configs', JSON.stringify(permanentConfig));
  
  // Set in admin environment variables format
  const envVars = [{
    key: 'VITE_OPENAI_API_KEY',
    value: CORRECT_KEY,
    description: 'OpenAI API key for AI content generation',
    is_secret: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  }];
  
  localStorage.setItem('admin_env_vars', JSON.stringify(envVars));
  
  console.log('✅ Correct API key set in all storage locations');
}

// Auto-run these functions
clearAllApiKeyCaches();
setCorrectApiKey();

console.log('🎯 API key cache reset complete. New key ending with: 1PsA');
