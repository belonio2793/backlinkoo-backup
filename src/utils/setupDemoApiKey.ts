/**
 * Demo API Key Setup Utility
 * This provides a way to set up API keys for testing purposes
 */

export function setupDemoApiKey(): boolean {
  try {
    // Check if we already have a VALID API key configured
    const envKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
    const localKey = localStorage.getItem('demo_openai_key');

    // Validate the key format - OpenAI keys should be sk- followed by 48+ characters
    const isValidKey = (key: string) => {
      return key &&
             key.startsWith('sk-') &&
             key.length >= 51 && // sk- + 48 characters minimum
             !key.includes('proj-') && // Project keys are different format and may not work
             !key.includes('demo-fallback'); // Not our demo key
    };

    if (envKey && isValidKey(envKey)) {
      console.log('✅ Valid OpenAI API key found in environment');
      return true;
    }

    if (localKey && isValidKey(localKey)) {
      console.log('✅ Valid OpenAI API key found in localStorage');
      return true;
    }

    // Clear any invalid keys
    if (envKey && envKey.startsWith('sk-') && !isValidKey(envKey)) {
      console.warn('⚠️ Invalid OpenAI API key format detected in environment, switching to demo mode');
    }

    if (localKey && localKey.startsWith('sk-') && !isValidKey(localKey)) {
      console.warn('⚠️ Invalid OpenAI API key format detected in localStorage, clearing it');
      localStorage.removeItem('demo_openai_key');
    }

    // For demo purposes, we'll use a placeholder that triggers fallback content
    // In production, users need to set their real API key
    const demoKey = 'sk-demo-fallback-content-generation-key';
    
    // Store in localStorage for this session
    localStorage.setItem('demo_openai_key', demoKey);
    
    console.log('🔧 Demo API key set up for fallback content generation');
    console.log('ℹ️ This will generate template content. Set a real OpenAI API key for AI-generated content.');
    
    return true;
  } catch (error) {
    console.error('Failed to setup demo API key:', error);
    return false;
  }
}

export function checkApiKeyStatus(): {
  hasKey: boolean;
  keyType: 'real' | 'demo' | 'none';
  message: string;
} {
  const envKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  const demoKey = localStorage.getItem('demo_openai_key');
  
  if (envKey && envKey.startsWith('sk-') && envKey.length > 20) {
    return {
      hasKey: true,
      keyType: 'real',
      message: 'Real OpenAI API key configured'
    };
  }
  
  if (demoKey) {
    return {
      hasKey: true,
      keyType: 'demo',
      message: 'Demo mode - will generate template content'
    };
  }
  
  return {
    hasKey: false,
    keyType: 'none',
    message: 'No API key configured'
  };
}

export function setRealApiKey(apiKey: string): boolean {
  try {
    if (!apiKey || !apiKey.startsWith('sk-') || apiKey.length < 20) {
      throw new Error('Invalid OpenAI API key format');
    }
    
    // Store in localStorage (in production, this should be in secure env vars)
    localStorage.setItem('demo_openai_key', apiKey);
    
    console.log('✅ Real OpenAI API key configured');
    return true;
  } catch (error) {
    console.error('Failed to set API key:', error);
    return false;
  }
}
