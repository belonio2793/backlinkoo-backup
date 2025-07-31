/**
 * Global Configuration Test Utility
 * Tests if global services can access configurations from admin dashboard
 */

import { globalOpenAI } from '@/services/globalOpenAIConfig';
import { adminGlobalSync } from '@/services/adminGlobalConfigSync';

export interface GlobalConfigTestResult {
  service: string;
  configured: boolean;
  accessible: boolean;
  working: boolean;
  error?: string;
  details: {
    source: string;
    keyMasked: string;
    lastSync?: string;
    healthScore?: number;
  };
}

export class GlobalConfigTest {
  /**
   * Test all global service configurations
   */
  static async testAllGlobalConfigs(): Promise<GlobalConfigTestResult[]> {
    const results: GlobalConfigTestResult[] = [];

    // Test OpenAI global configuration
    const openAIResult = await this.testOpenAIGlobalConfig();
    results.push(openAIResult);

    return results;
  }

  /**
   * Test OpenAI global configuration specifically
   */
  static async testOpenAIGlobalConfig(): Promise<GlobalConfigTestResult> {
    const result: GlobalConfigTestResult = {
      service: 'OpenAI',
      configured: false,
      accessible: false,
      working: false,
      details: {
        source: 'unknown',
        keyMasked: 'not configured'
      }
    };

    try {
      // Check if global service thinks it's configured
      result.configured = globalOpenAI.isConfigured();
      
      if (result.configured) {
        // Get masked key for debugging
        result.details.keyMasked = globalOpenAI.getMaskedKey();
        result.accessible = true;

        // Test actual connection
        result.working = await globalOpenAI.testConnection();

        // Determine source of configuration
        const envKey = import.meta.env.VITE_OPENAI_API_KEY;
        const adminKey = adminGlobalSync.getAdminConfig('VITE_OPENAI_API_KEY');
        
        if (envKey && envKey.startsWith('sk-')) {
          result.details.source = 'environment variable';
        } else if (adminKey && adminKey.startsWith('sk-')) {
          result.details.source = 'admin configuration';
        } else {
          result.details.source = 'permanent storage';
        }

        // Get sync status
        const syncStatus = adminGlobalSync.getSyncStatus();
        const openAISyncStatus = syncStatus['VITE_OPENAI_API_KEY'];
        if (openAISyncStatus) {
          result.details.lastSync = openAISyncStatus.lastSync;
        }

        // Get health score
        const healthStatus = await globalOpenAI.getHealthStatus();
        result.details.healthScore = healthStatus.healthScore;

      } else {
        result.error = 'Global OpenAI service reports not configured';
      }

    } catch (error) {
      result.error = error instanceof Error ? error.message : 'Unknown error';
      console.error('Global OpenAI config test failed:', error);
    }

    return result;
  }

  /**
   * Diagnose configuration issues and provide solutions
   */
  static async diagnoseIssues(): Promise<{
    issues: string[];
    solutions: string[];
    adminConfigured: boolean;
    globalAccessible: boolean;
  }> {
    const issues: string[] = [];
    const solutions: string[] = [];

    // Check admin configuration
    const adminConfigs = adminGlobalSync.getAdminConfigs();
    const adminConfigured = !!(adminConfigs['VITE_OPENAI_API_KEY'] && adminConfigs['VITE_OPENAI_API_KEY'].startsWith('sk-'));

    // Test global access
    let globalAccessible = false;
    try {
      globalAccessible = globalOpenAI.isConfigured();
    } catch (error) {
      issues.push(`Global service error: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    // Diagnose specific issues
    if (!adminConfigured) {
      issues.push('No OpenAI API key configured in admin dashboard');
      solutions.push('Add a valid OpenAI API key in the Admin Dashboard > API Configuration Manager');
    }

    if (adminConfigured && !globalAccessible) {
      issues.push('Admin has API key but global service cannot access it');
      solutions.push('Check if admin configuration is synced to global services');
      solutions.push('Try testing the API key in admin dashboard to trigger sync');
    }

    if (globalAccessible) {
      try {
        const working = await globalOpenAI.testConnection();
        if (!working) {
          issues.push('Global service has API key but connection test fails');
          solutions.push('Verify the API key is valid and has proper permissions');
          solutions.push('Check if OpenAI account has billing enabled');
        }
      } catch (error) {
        issues.push(`Connection test failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
        solutions.push('Check network connectivity and API key validity');
      }
    }

    return {
      issues,
      solutions,
      adminConfigured,
      globalAccessible
    };
  }

  /**
   * Force synchronization from admin to global services
   */
  static async forceSyncAdminToGlobal(): Promise<{ success: boolean; synced: number; errors: string[] }> {
    try {
      const result = await adminGlobalSync.forceSyncAll();
      return result;
    } catch (error) {
      return {
        success: false,
        synced: 0,
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Quick health check for troubleshooting
   */
  static async quickHealthCheck(): Promise<{
    status: 'healthy' | 'degraded' | 'critical';
    summary: string;
    adminConfigured: number;
    globalWorking: number;
    totalServices: number;
  }> {
    try {
      const results = await this.testAllGlobalConfigs();
      const totalServices = results.length;
      const adminConfigured = adminGlobalSync.getAdminConfigs();
      const adminConfiguredCount = Object.keys(adminConfigured).length;
      const globalWorkingCount = results.filter(r => r.working).length;

      let status: 'healthy' | 'degraded' | 'critical' = 'critical';
      let summary = 'No services working';

      if (globalWorkingCount === totalServices) {
        status = 'healthy';
        summary = 'All services working perfectly';
      } else if (globalWorkingCount > 0) {
        status = 'degraded';
        summary = `${globalWorkingCount}/${totalServices} services working`;
      }

      return {
        status,
        summary,
        adminConfigured: adminConfiguredCount,
        globalWorking: globalWorkingCount,
        totalServices
      };

    } catch (error) {
      return {
        status: 'critical',
        summary: `Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        adminConfigured: 0,
        globalWorking: 0,
        totalServices: 0
      };
    }
  }
}

// Export singleton instance
export const globalConfigTest = GlobalConfigTest;
