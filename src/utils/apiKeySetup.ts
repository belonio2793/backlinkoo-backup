/**
 * API Key Setup Helper
 * Provides utilities for managing API keys across different environments
 */

export interface ApiKeyStatus {
  provider: string;
  configured: boolean;
  environment: 'client' | 'server' | 'both' | 'none';
  keyPrefix?: string;
}

export const API_KEY_CONFIG = {
  openai: {
    client: 'VITE_OPENAI_API_KEY',
    server: 'OPENAI_API_KEY',
    name: 'OpenAI'
  }
};

/**
 * Get API key for a provider from environment
 */
export function getApiKey(provider: keyof typeof API_KEY_CONFIG): string | undefined {
  const config = API_KEY_CONFIG[provider];
  if (!config) return undefined;

  // Try client-side first (for Vite), then server-side
  return import.meta.env?.[config.client] || 
         process.env?.[config.server] || 
         undefined;
}

/**
 * Check API key configuration status for all providers
 */
export function checkApiKeyStatus(): ApiKeyStatus[] {
  return Object.entries(API_KEY_CONFIG).map(([key, config]) => {
    const clientKey = import.meta.env?.[config.client];
    const serverKey = process.env?.[config.server];
    
    let environment: 'client' | 'server' | 'both' | 'none' = 'none';
    let keyPrefix: string | undefined;

    if (clientKey && serverKey) {
      environment = 'both';
      keyPrefix = clientKey.substring(0, 8) + '...';
    } else if (clientKey) {
      environment = 'client';
      keyPrefix = clientKey.substring(0, 8) + '...';
    } else if (serverKey) {
      environment = 'server';
      keyPrefix = serverKey.substring(0, 8) + '...';
    }

    return {
      provider: config.name,
      configured: Boolean(clientKey || serverKey),
      environment,
      keyPrefix
    };
  });
}

/**
 * Generate environment variable setup instructions
 */
export function generateEnvSetup(): string {
  const envVars = Object.entries(API_KEY_CONFIG)
    .map(([key, config]) => `# ${config.name}\n${config.client}=your_${key}_api_key\n${config.server}=your_${key}_api_key`)
    .join('\n\n');

  return `# Add these to your .env file:\n\n${envVars}`;
}

/**
 * Validate API key format (basic validation)
 */
export function validateApiKey(provider: keyof typeof API_KEY_CONFIG, key: string): boolean {
  if (!key || key.length < 10) return false;

  // Basic format validation for OpenAI
  const patterns = {
    openai: /^sk-/
  };

  const pattern = patterns[provider];
  return pattern ? pattern.test(key) : true;
}

/**
 * Helper for debugging API key issues
 */
export function debugApiKeys(): void {
  console.log('🔑 API Key Configuration Status:');
  
  const status = checkApiKeyStatus();
  status.forEach(s => {
    console.log(`${s.provider}: ${s.configured ? '✅' : '❌'} (${s.environment}) ${s.keyPrefix || ''}`);
  });

  if (status.every(s => !s.configured)) {
    console.log('\n📝 Setup Instructions:');
    console.log(generateEnvSetup());
  }
}

// Auto-debug in development
if (import.meta.env.DEV) {
  debugApiKeys();
}
