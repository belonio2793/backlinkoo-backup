/**
 * Comprehensive API Validation Utility
 * Ensures OpenAI integration works 100% for all users
 */

import { enhancedOpenAIService } from '@/services/api/enhancedOpenAI';
import { openAIOnlyContentGenerator } from '@/services/openAIOnlyContentGenerator';

export interface ValidationResult {
  success: boolean;
  component: string;
  message: string;
  details?: any;
  error?: string;
}

export interface ComprehensiveValidation {
  overall: boolean;
  results: ValidationResult[];
  summary: {
    passed: number;
    failed: number;
    total: number;
  };
}

export class ApiValidationService {
  
  /**
   * Run comprehensive validation of all API components
   */
  static async validateAll(): Promise<ComprehensiveValidation> {
    console.log('🔍 Starting comprehensive API validation...');
    
    const validations = [
      { name: 'Environment Variables', test: () => this.validateEnvironmentVariables() },
      { name: 'Enhanced OpenAI Service', test: () => this.validateEnhancedService() },
      { name: 'Content Generator', test: () => this.validateContentGenerator() },
      { name: 'Connection Test', test: () => this.validateConnection() },
      { name: 'Generation Test', test: () => this.validateGeneration() }
    ];

    const results: ValidationResult[] = [];

    for (const { name, test } of validations) {
      try {
        const result = await test();
        results.push({
          component: name,
          ...result
        });
      } catch (error) {
        results.push({
          component: name,
          success: false,
          message: 'Validation failed',
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }

    const passed = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;
    const overall = failed === 0;

    console.log(`📊 Validation complete: ${passed}/${results.length} passed`);

    return {
      overall,
      results,
      summary: {
        passed,
        failed,
        total: results.length
      }
    };
  }

  /**
   * Validate environment variables are properly set
   */
  private static async validateEnvironmentVariables(): Promise<ValidationResult> {
    const envVars = [
      { key: 'VITE_OPENAI_API_KEY', value: import.meta.env.VITE_OPENAI_API_KEY },
      { key: 'OPENAI_API_KEY', value: import.meta.env.OPENAI_API_KEY }
    ];

    const configuredVars = envVars.filter(env => env.value && env.value.startsWith('sk-'));
    
    if (configuredVars.length === 0) {
      return {
        success: false,
        message: 'No valid OpenAI API keys found in environment variables',
        details: {
          checked: envVars.map(env => ({
            key: env.key,
            present: !!env.value,
            valid: env.value ? env.value.startsWith('sk-') : false
          }))
        }
      };
    }

    return {
      success: true,
      message: `OpenAI API key(s) configured (${configuredVars.length} found)`,
      details: {
        configured: configuredVars.map(env => ({
          key: env.key,
          keyPreview: `${env.value.substring(0, 7)}...${env.value.substring(env.value.length - 4)}`
        }))
      }
    };
  }

  /**
   * Validate enhanced OpenAI service
   */
  private static async validateEnhancedService(): Promise<ValidationResult> {
    const isConfigured = enhancedOpenAIService.isConfigured();
    
    if (!isConfigured) {
      return {
        success: false,
        message: 'Enhanced OpenAI service not configured'
      };
    }

    const health = enhancedOpenAIService.getServiceHealth();
    
    return {
      success: health.status !== 'unhealthy',
      message: `Service health: ${health.status}`,
      details: health.details
    };
  }

  /**
   * Validate content generator service
   */
  private static async validateContentGenerator(): Promise<ValidationResult> {
    const isConfigured = openAIOnlyContentGenerator.isConfigured();
    
    if (!isConfigured) {
      return {
        success: false,
        message: 'Content generator not configured'
      };
    }

    try {
      const status = await openAIOnlyContentGenerator.getProviderStatus();
      const openAIWorking = status.openai;

      return {
        success: openAIWorking,
        message: openAIWorking ? 'Content generator ready' : 'Content generator connection failed',
        details: status
      };
    } catch (error) {
      return {
        success: false,
        message: 'Content generator test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate API connection
   */
  private static async validateConnection(): Promise<ValidationResult> {
    try {
      const connectionTest = await enhancedOpenAIService.testConnection();
      
      return {
        success: connectionTest.success,
        message: connectionTest.success ? 'Connection successful' : 'Connection failed',
        details: connectionTest.details
      };
    } catch (error) {
      return {
        success: false,
        message: 'Connection test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Validate content generation
   */
  private static async validateGeneration(): Promise<ValidationResult> {
    try {
      const testPrompt = "Write a brief 50-word test message about API validation.";
      
      const result = await enhancedOpenAIService.generateContent(testPrompt, {
        model: 'gpt-3.5-turbo',
        maxTokens: 100,
        temperature: 0.5
      });

      if (!result.success) {
        return {
          success: false,
          message: 'Content generation failed',
          error: result.error
        };
      }

      if (!result.content || result.content.length < 20) {
        return {
          success: false,
          message: 'Generated content too short or empty'
        };
      }

      return {
        success: true,
        message: 'Content generation successful',
        details: {
          contentLength: result.content.length,
          tokens: result.usage.tokens,
          responseTime: result.responseTime,
          provider: result.provider
        }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Generation test failed',
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Quick validation check (lightweight)
   */
  static async quickCheck(): Promise<boolean> {
    try {
      // Check if service is configured
      if (!enhancedOpenAIService.isConfigured()) {
        return false;
      }

      // Check service health
      const health = enhancedOpenAIService.getServiceHealth();
      if (health.status === 'unhealthy') {
        return false;
      }

      return true;
    } catch (error) {
      console.error('Quick validation check failed:', error);
      return false;
    }
  }

  /**
   * Get user-friendly status message
   */
  static async getStatusMessage(): Promise<{
    status: 'ready' | 'warning' | 'error';
    message: string;
    action?: string;
  }> {
    try {
      const validation = await this.validateAll();
      
      if (validation.overall) {
        return {
          status: 'ready',
          message: 'All systems operational - API is fully functional'
        };
      }

      const criticalFailures = validation.results.filter(r => 
        !r.success && (r.component.includes('Environment') || r.component.includes('Connection'))
      );

      if (criticalFailures.length > 0) {
        return {
          status: 'error',
          message: 'API configuration error - service unavailable',
          action: 'Check API key configuration'
        };
      }

      return {
        status: 'warning',
        message: 'Partial functionality - some features may be limited',
        action: 'Review system status'
      };

    } catch (error) {
      return {
        status: 'error',
        message: 'Unable to validate API status',
        action: 'Contact support'
      };
    }
  }
}

// Convenience exports
export const validateApiSetup = ApiValidationService.validateAll;
export const quickApiCheck = ApiValidationService.quickCheck;
export const getApiStatusMessage = ApiValidationService.getStatusMessage;
