/**
 * Utility to clear invalid API keys and reset to demo mode
 */

import { setupDemoApiKey, checkApiKeyStatus } from './setupDemoApiKey';

export function clearInvalidApiKeys(): {
  cleared: boolean;
  previousKey?: string;
  newStatus: string;
} {
  console.log('🧹 Checking for invalid API keys...');
  
  const status = checkApiKeyStatus();
  
  if (status.keyType === 'invalid') {
    console.log('❌ Invalid API key detected, clearing and setting up demo mode');
    
    // Clear localStorage API key if it's invalid
    const localKey = localStorage.getItem('demo_openai_key');
    if (localKey && localKey.startsWith('sk-') && !localKey.includes('demo-fallback')) {
      localStorage.removeItem('demo_openai_key');
      console.log('🗑️ Cleared invalid key from localStorage');
    }
    
    // Setup demo mode
    setupDemoApiKey();
    
    return {
      cleared: true,
      previousKey: status.keyPreview,
      newStatus: 'Demo mode activated'
    };
  }
  
  if (status.keyType === 'none') {
    console.log('🔧 No API key found, setting up demo mode');
    setupDemoApiKey();
    
    return {
      cleared: false,
      newStatus: 'Demo mode activated'
    };
  }
  
  console.log(`✅ API key status is good: ${status.keyType}`);
  return {
    cleared: false,
    newStatus: status.message
  };
}

export function forceResetToDemo(): void {
  console.log('🔄 Force resetting to demo mode...');
  
  // Clear any existing keys
  localStorage.removeItem('demo_openai_key');
  
  // Setup fresh demo mode
  setupDemoApiKey();
  
  console.log('✅ Reset to demo mode complete');
}
