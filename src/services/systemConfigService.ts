interface SystemConfig {
  openaiApiKey: string | null;
  keyStatus: 'loading' | 'available' | 'missing' | 'invalid';
  lastUpdated: Date | null;
  error?: string;
}

interface OpenAITestResult {
  success: boolean;
  model?: string;
  error?: string;
  usage?: any;
}

class SystemConfigurationService {
  private config: SystemConfig = {
    openaiApiKey: null,
    keyStatus: 'loading',
    lastUpdated: null
  };

  private listeners: Array<(config: SystemConfig) => void> = [];

  /**
   * Subscribe to configuration changes
   */
  subscribe(callback: (config: SystemConfig) => void): () => void {
    this.listeners.push(callback);
    
    // Immediately call with current state
    callback(this.config);
    
    // Return unsubscribe function
    return () => {
      this.listeners = this.listeners.filter(listener => listener !== callback);
    };
  }

  /**
   * Notify all listeners of config changes
   */
  private notifyListeners() {
    this.listeners.forEach(listener => listener(this.config));
  }

  /**
   * Get current configuration
   */
  getConfig(): SystemConfig {
    return { ...this.config };
  }

  /**
   * Fetch OpenAI API key from Netlify function
   */
  async fetchOpenAIKey(): Promise<string | null> {
    try {
      console.log('🔑 Fetching OpenAI API key from Netlify...');

      this.config.keyStatus = 'loading';
      this.notifyListeners();

      const response = await fetch('/api/get-openai-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });

      // Check if response is ok before trying to parse JSON
      if (!response.ok) {
        const errorText = await response.text();
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error || errorMessage;
        } catch {
          // If JSON parsing fails, use the text response
          errorMessage = errorText || errorMessage;
        }

        console.error('❌ Failed to get API key - HTTP error:', errorMessage);
        this.config.keyStatus = 'missing';
        this.config.error = errorMessage;
        this.notifyListeners();
        return null;
      }

      // Parse the JSON response only once
      let result;
      try {
        result = await response.json();
      } catch (parseError: any) {
        console.error('❌ Failed to parse response JSON:', parseError);
        this.config.keyStatus = 'missing';
        this.config.error = 'Invalid response format from server';
        this.notifyListeners();
        return null;
      }

      if (!result.success) {
        console.error('❌ Failed to get API key:', result.error);
        this.config.keyStatus = 'missing';
        this.config.error = result.error;
        this.notifyListeners();
        return null;
      }

      const apiKey = result.api_key;
      console.log(`✅ OpenAI API key retrieved: ${result.key_prefix}...`);

      this.config.openaiApiKey = apiKey;
      this.config.keyStatus = 'available';
      this.config.lastUpdated = new Date();
      this.config.error = undefined;
      this.notifyListeners();

      return apiKey;
    } catch (error: any) {
      console.error('❌ Error fetching OpenAI API key:', error);
      this.config.keyStatus = 'missing';
      this.config.error = error.message || 'Network error occurred';
      this.notifyListeners();
      return null;
    }
  }

  /**
   * Test OpenAI API key by making a simple request
   */
  async testOpenAIKey(apiKey?: string): Promise<OpenAITestResult> {
    const keyToTest = apiKey || this.config.openaiApiKey;
    
    if (!keyToTest) {
      return {
        success: false,
        error: 'No API key available to test'
      };
    }

    try {
      console.log('🧪 Testing OpenAI API key...');

      const response = await fetch('https://api.openai.com/v1/models', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${keyToTest}`,
          'Content-Type': 'application/json'
        }
      });

      if (!response.ok) {
        let errorMessage = `HTTP ${response.status}: ${response.statusText}`;

        try {
          const errorText = await response.text();
          const errorData = JSON.parse(errorText);
          errorMessage = errorData.error?.message || errorMessage;
        } catch {
          // If parsing fails, use the default error message
        }

        return {
          success: false,
          error: errorMessage
        };
      }

      const data = await response.json();
      const models = data.data || [];
      const gptModel = models.find((m: any) => m.id.includes('gpt'));

      console.log(`✅ OpenAI API key test successful. ${models.length} models available.`);

      return {
        success: true,
        model: gptModel?.id || 'Model list retrieved',
        usage: {
          total_models: models.length,
          gpt_models: models.filter((m: any) => m.id.includes('gpt')).length
        }
      };
    } catch (error: any) {
      console.error('❌ OpenAI API test failed:', error);
      return {
        success: false,
        error: error.message || 'Network error during API test'
      };
    }
  }

  /**
   * Make a request to OpenAI API
   */
  async makeOpenAIRequest(endpoint: string, payload: any): Promise<any> {
    const apiKey = this.config.openaiApiKey;
    
    if (!apiKey) {
      throw new Error('OpenAI API key not available. Call fetchOpenAIKey() first.');
    }

    const response = await fetch(`https://api.openai.com/v1/${endpoint}`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error?.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  }

  /**
   * Initialize the service
   */
  async initialize(): Promise<void> {
    console.log('🚀 Initializing system configuration service...');
    
    // Fetch the API key on initialization
    await this.fetchOpenAIKey();
    
    // Test the key if we got one
    if (this.config.openaiApiKey) {
      const testResult = await this.testOpenAIKey();
      if (!testResult.success) {
        this.config.keyStatus = 'invalid';
        this.config.error = testResult.error;
        this.notifyListeners();
      }
    }
    
    console.log('✅ System configuration service initialized');
  }

  /**
   * Refresh configuration
   */
  async refresh(): Promise<void> {
    await this.fetchOpenAIKey();
  }

  /**
   * Get OpenAI API key status for UI display
   */
  getOpenAIStatus() {
    return {
      hasKey: !!this.config.openaiApiKey,
      status: this.config.keyStatus,
      error: this.config.error,
      lastUpdated: this.config.lastUpdated,
      keyPrefix: this.config.openaiApiKey?.substring(0, 10)
    };
  }
}

// Export singleton instance
export const systemConfig = new SystemConfigurationService();

// Auto-initialize
systemConfig.initialize().catch(console.error);
