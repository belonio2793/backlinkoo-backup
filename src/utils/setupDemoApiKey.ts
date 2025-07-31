/**
 * Demo API Key Setup Utility
 * This provides a way to set up API keys for testing purposes
 */

export function setupDemoApiKey(): boolean {
  try {
    // Check if we already have an API key configured
    const existingKey = import.meta.env.VITE_OPENAI_API_KEY || 
                       import.meta.env.OPENAI_API_KEY || 
                       localStorage.getItem('demo_openai_key');
    
    if (existingKey && existingKey.startsWith('sk-')) {
      console.log('✅ OpenAI API key already configured');
      return true;
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
