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
  keyType: 'real' | 'demo' | 'invalid' | 'none';
  message: string;
  keyPreview?: string;
} {
  const envKey = import.meta.env.VITE_OPENAI_API_KEY || import.meta.env.OPENAI_API_KEY;
  const localKey = localStorage.getItem('demo_openai_key');

  // Improved validation function
  const isValidKey = (key: string) => {
    return key &&
           key.startsWith('sk-') &&
           key.length >= 51 &&
           !key.includes('proj-') && // Project keys often don't work for direct API calls
           !key.includes('demo-fallback');
  };

  // Check environment key first
  if (envKey) {
    if (isValidKey(envKey)) {
      return {
        hasKey: true,
        keyType: 'real',
        message: 'Valid OpenAI API key configured',
        keyPreview: envKey.substring(0, 15) + '...'
      };
    } else if (envKey.startsWith('sk-')) {
      return {
        hasKey: false,
        keyType: 'invalid',
        message: 'Invalid OpenAI API key format detected',
        keyPreview: envKey.substring(0, 15) + '...'
      };
    }
  }

  // Check local storage key
  if (localKey) {
    if (localKey.includes('demo-fallback')) {
      return {
        hasKey: true,
        keyType: 'demo',
        message: 'Demo mode - will generate template content'
      };
    } else if (isValidKey(localKey)) {
      return {
        hasKey: true,
        keyType: 'real',
        message: 'Valid OpenAI API key configured in localStorage',
        keyPreview: localKey.substring(0, 15) + '...'
      };
    } else if (localKey.startsWith('sk-')) {
      return {
        hasKey: false,
        keyType: 'invalid',
        message: 'Invalid OpenAI API key format in localStorage',
        keyPreview: localKey.substring(0, 15) + '...'
      };
    }
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
