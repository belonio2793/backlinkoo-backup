/**
 * API Key Rotation Manager
 * Manages multiple API keys for improved reliability and rate limit handling
 */

export interface ApiKeyConfig {
  provider: string;
  keys: string[];
  currentIndex: number;
  lastRotation: number;
  rotationInterval: number; // milliseconds
  failureThreshold: number;
  failureCounts: Map<string, number>;
}

export class ApiKeyRotationManager {
  private configs: Map<string, ApiKeyConfig> = new Map();
  private blacklistedKeys: Set<string> = new Set();

  constructor() {
    this.initializeConfigs();
  }

  /**
   * Initialize API key configurations
   */
  private initializeConfigs(): void {
    // OpenAI configuration
    const openaiKeys = this.getOpenAIKeys();
    if (openaiKeys.length > 0) {
      this.configs.set('openai', {
        provider: 'openai',
        keys: openaiKeys,
        currentIndex: 0,
        lastRotation: Date.now(),
        rotationInterval: 5 * 60 * 1000, // 5 minutes
        failureThreshold: 3,
        failureCounts: new Map()
      });
    }

    // Cohere configuration (if available)
    const cohereKeys = this.getCohereKeys();
    if (cohereKeys.length > 0) {
      this.configs.set('cohere', {
        provider: 'cohere',
        keys: cohereKeys,
        currentIndex: 0,
        lastRotation: Date.now(),
        rotationInterval: 10 * 60 * 1000, // 10 minutes
        failureThreshold: 2,
        failureCounts: new Map()
      });
    }
  }

  /**
   * Get OpenAI API keys from various sources
   */
  private getOpenAIKeys(): string[] {
    const keys: string[] = [];
    
    // Primary key from environment
    const envKey = import.meta.env.OPENAI_API_KEY;
    if (envKey && envKey.startsWith('sk-')) {
      keys.push(envKey);
    }

    // Secondary keys from secure config
    try {
      const { SecureConfig } = require('@/lib/secure-config');
      const secureKey = SecureConfig.OPENAI_API_KEY;
      if (secureKey && secureKey.startsWith('sk-') && !keys.includes(secureKey)) {
        keys.push(secureKey);
      }
    } catch (error) {
      console.warn('Could not load secure config for API keys');
    }

    // Additional backup keys (can be added manually)
    const backupKeys = [
      import.meta.env.OPENAI_API_KEY_BACKUP_1,
      import.meta.env.OPENAI_API_KEY_BACKUP_2,
      import.meta.env.OPENAI_API_KEY_BACKUP_3
    ].filter(key => key && key.startsWith('sk-') && !keys.includes(key));

    keys.push(...backupKeys);

    return keys.filter(key => !this.blacklistedKeys.has(key));
  }

  /**
   * Get Cohere API keys
   */
  private getCohereKeys(): string[] {
    const keys: string[] = [];
    
    const envKey = import.meta.env.VITE_COHERE_API_KEY;
    if (envKey) {
      keys.push(envKey);
    }

    return keys.filter(key => !this.blacklistedKeys.has(key));
  }

  /**
   * Get current API key for a provider
   */
  getCurrentKey(provider: string): string | null {
    const config = this.configs.get(provider);
    if (!config || config.keys.length === 0) {
      return null;
    }

    // Check if rotation is needed
    this.checkRotation(provider);

    return config.keys[config.currentIndex];
  }

  /**
   * Report an API key failure
   */
  reportFailure(provider: string, apiKey: string, error: Error): void {
    const config = this.configs.get(provider);
    if (!config) return;

    const currentCount = config.failureCounts.get(apiKey) || 0;
    config.failureCounts.set(apiKey, currentCount + 1);

    console.warn(`🔑 API key failure for ${provider}: ${error.message}`);

    // Check if key should be blacklisted
    if (currentCount + 1 >= config.failureThreshold) {
      console.warn(`🚫 Blacklisting API key for ${provider} due to repeated failures`);
      this.blacklistedKeys.add(apiKey);
      
      // Remove from current config
      config.keys = config.keys.filter(key => key !== apiKey);
      config.failureCounts.delete(apiKey);
      
      // Force rotation to next key
      this.rotateKey(provider);
    } else if (error.message.includes('401') || error.message.includes('Invalid API key')) {
      // Immediate blacklist for auth errors
      console.warn(`🚫 Immediate blacklist for ${provider} due to authentication error`);
      this.blacklistedKeys.add(apiKey);
      config.keys = config.keys.filter(key => key !== apiKey);
      this.rotateKey(provider);
    }
  }

  /**
   * Report successful API key usage
   */
  reportSuccess(provider: string, apiKey: string): void {
    const config = this.configs.get(provider);
    if (!config) return;

    // Reset failure count on success
    config.failureCounts.delete(apiKey);
  }

  /**
   * Check if key rotation is needed
   */
  private checkRotation(provider: string): void {
    const config = this.configs.get(provider);
    if (!config) return;

    const now = Date.now();
    if (now - config.lastRotation > config.rotationInterval) {
      this.rotateKey(provider);
    }
  }

  /**
   * Rotate to next available API key
   */
  private rotateKey(provider: string): void {
    const config = this.configs.get(provider);
    if (!config || config.keys.length <= 1) return;

    const oldIndex = config.currentIndex;
    config.currentIndex = (config.currentIndex + 1) % config.keys.length;
    config.lastRotation = Date.now();

    console.log(`🔄 Rotated ${provider} API key from index ${oldIndex} to ${config.currentIndex}`);
  }

  /**
   * Force rotation to next key
   */
  forceRotation(provider: string): void {
    this.rotateKey(provider);
  }

  /**
   * Get provider status
   */
  getProviderStatus(provider: string): {
    hasKeys: boolean;
    totalKeys: number;
    currentIndex: number;
    blacklistedCount: number;
    lastRotation: Date;
    nextRotation: Date;
  } | null {
    const config = this.configs.get(provider);
    if (!config) return null;

    const blacklistedCount = Array.from(this.blacklistedKeys).filter(key => 
      this.getAllKeysForProvider(provider).includes(key)
    ).length;

    return {
      hasKeys: config.keys.length > 0,
      totalKeys: config.keys.length,
      currentIndex: config.currentIndex,
      blacklistedCount,
      lastRotation: new Date(config.lastRotation),
      nextRotation: new Date(config.lastRotation + config.rotationInterval)
    };
  }

  /**
   * Get all keys for a provider (including blacklisted)
   */
  private getAllKeysForProvider(provider: string): string[] {
    if (provider === 'openai') {
      return this.getOpenAIKeys().concat(Array.from(this.blacklistedKeys).filter(k => k.startsWith('sk-')));
    }
    if (provider === 'cohere') {
      return this.getCohereKeys().concat(Array.from(this.blacklistedKeys).filter(k => !k.startsWith('sk-')));
    }
    return [];
  }

  /**
   * Add new API key
   */
  addApiKey(provider: string, apiKey: string): boolean {
    if (this.blacklistedKeys.has(apiKey)) {
      console.warn(`Cannot add blacklisted key for ${provider}`);
      return false;
    }

    const config = this.configs.get(provider);
    if (!config) {
      // Create new config
      this.configs.set(provider, {
        provider,
        keys: [apiKey],
        currentIndex: 0,
        lastRotation: Date.now(),
        rotationInterval: 5 * 60 * 1000,
        failureThreshold: 3,
        failureCounts: new Map()
      });
      return true;
    }

    if (!config.keys.includes(apiKey)) {
      config.keys.push(apiKey);
      console.log(`➕ Added new API key for ${provider}`);
      return true;
    }

    return false;
  }

  /**
   * Remove API key from blacklist
   */
  rehabilitateKey(apiKey: string): void {
    if (this.blacklistedKeys.delete(apiKey)) {
      console.log(`♻️ Rehabilitated API key: ${apiKey.substring(0, 8)}...`);
      // Re-initialize configs to pick up the key
      this.initializeConfigs();
    }
  }

  /**
   * Get overall system health
   */
  getSystemHealth(): {
    healthy: boolean;
    providers: Record<string, any>;
    totalKeys: number;
    blacklistedKeys: number;
  } {
    const providers: Record<string, any> = {};
    let totalKeys = 0;
    let hasHealthyProvider = false;

    for (const [provider, config] of this.configs) {
      const status = this.getProviderStatus(provider);
      providers[provider] = status;
      totalKeys += status?.totalKeys || 0;
      
      if (status?.hasKeys) {
        hasHealthyProvider = true;
      }
    }

    return {
      healthy: hasHealthyProvider,
      providers,
      totalKeys,
      blacklistedKeys: this.blacklistedKeys.size
    };
  }
}

// Export singleton instance
export const apiKeyRotationManager = new ApiKeyRotationManager();
