/**
 * Admin-Global Configuration Synchronization Service
 * Ensures admin dashboard API configurations are synced with global services
 */

import { globalOpenAI } from './globalOpenAIConfig';

export interface AdminAPIConfig {
  key: string;
  value: string;
  status: 'valid' | 'invalid' | 'unconfigured';
  lastTested?: Date;
  syncedToGlobal?: boolean;
}

export class AdminGlobalConfigSync {
  private static readonly ADMIN_CONFIG_KEY = 'admin_api_configs';
  private static readonly SYNC_STATUS_KEY = 'admin_config_sync_status';

  /**
   * Save API configuration in admin dashboard and sync to global services
   */
  static async saveAdminConfig(key: string, value: string): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`💾 Saving admin config: ${key}`);
      
      // Save to admin storage
      const adminConfigs = this.getAdminConfigs();
      adminConfigs[key] = value;
      localStorage.setItem(this.ADMIN_CONFIG_KEY, JSON.stringify(adminConfigs));

      // Sync to global services based on key type
      let syncSuccess = false;
      if (key === 'OPENAI_API_KEY') {
        syncSuccess = await this.syncOpenAIToGlobal(value);
      }

      // Update sync status
      this.updateSyncStatus(key, syncSuccess);

      console.log(`✅ Admin config saved and ${syncSuccess ? 'synced' : 'sync failed'} for ${key}`);
      return { success: true };

    } catch (error) {
      console.error('❌ Failed to save admin config:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get all admin configurations
   */
  static getAdminConfigs(): { [key: string]: string } {
    try {
      return JSON.parse(localStorage.getItem(this.ADMIN_CONFIG_KEY) || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Get specific admin configuration
   */
  static getAdminConfig(key: string): string | null {
    const configs = this.getAdminConfigs();
    return configs[key] || null;
  }

  /**
   * Test and validate admin configuration
   */
  static async testAdminConfig(key: string, value: string): Promise<{ valid: boolean; message: string; responseTime?: number }> {
    try {
      const startTime = Date.now();

      if (key === 'OPENAI_API_KEY') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${value}`,
            'Content-Type': 'application/json'
          }
        });

        const responseTime = Date.now() - startTime;

        if (response.ok) {
          return { 
            valid: true, 
            message: 'OpenAI API key is valid and working', 
            responseTime 
          };
        } else {
          const errorData = await response.json().catch(() => ({}));
          return { 
            valid: false, 
            message: `API Error: ${errorData.error?.message || 'Invalid API key'}`,
            responseTime 
          };
        }
      }

      return { valid: false, message: 'Unknown configuration type' };

    } catch (error) {
      return { 
        valid: false, 
        message: `Test failed: ${error instanceof Error ? error.message : 'Unknown error'}` 
      };
    }
  }

  /**
   * Sync OpenAI configuration to global service
   */
  private static async syncOpenAIToGlobal(apiKey: string): Promise<boolean> {
    try {
      // Test the key first
      const testResult = await this.testAdminConfig('OPENAI_API_KEY', apiKey);
      if (!testResult.valid) {
        console.warn('⚠️ Not syncing invalid OpenAI key to global service');
        return false;
      }

      // Sync to environment backup
      const envBackup = JSON.parse(localStorage.getItem('environment_backup') || '{}');
      envBackup['OPENAI_API_KEY'] = {
        value: apiKey,
        service: 'OpenAI',
        savedAt: new Date().toISOString(),
        healthScore: 100,
        syncedFromAdmin: true
      };
      localStorage.setItem('environment_backup', JSON.stringify(envBackup));

      // Sync to permanent configs
      const permanentConfigs = JSON.parse(localStorage.getItem('permanent_api_configs') || '[]');
      const existingIndex = permanentConfigs.findIndex((c: any) => c.service === 'OpenAI');
      
      const config = {
        service: 'OpenAI',
        apiKey,
        isActive: true,
        lastTested: new Date().toISOString(),
        healthScore: 100,
        metadata: {
          version: 'gpt-3.5-turbo',
          environment: import.meta.env.MODE || 'development',
          syncedFromAdmin: true,
          savedAt: new Date().toISOString()
        }
      };

      if (existingIndex >= 0) {
        permanentConfigs[existingIndex] = config;
      } else {
        permanentConfigs.push(config);
      }
      
      localStorage.setItem('permanent_api_configs', JSON.stringify(permanentConfigs));

      console.log('✅ OpenAI configuration synced to global service');
      return true;

    } catch (error) {
      console.error('❌ Failed to sync OpenAI to global:', error);
      return false;
    }
  }

  /**
   * Update synchronization status
   */
  private static updateSyncStatus(key: string, success: boolean): void {
    try {
      const syncStatus = JSON.parse(localStorage.getItem(this.SYNC_STATUS_KEY) || '{}');
      syncStatus[key] = {
        lastSync: new Date().toISOString(),
        success,
        attempts: (syncStatus[key]?.attempts || 0) + 1
      };
      localStorage.setItem(this.SYNC_STATUS_KEY, JSON.stringify(syncStatus));
    } catch (error) {
      console.warn('Failed to update sync status:', error);
    }
  }

  /**
   * Get synchronization status for all configurations
   */
  static getSyncStatus(): { [key: string]: { lastSync: string; success: boolean; attempts: number } } {
    try {
      return JSON.parse(localStorage.getItem(this.SYNC_STATUS_KEY) || '{}');
    } catch {
      return {};
    }
  }

  /**
   * Force sync all admin configurations to global services
   */
  static async forceSyncAll(): Promise<{ synced: number; total: number; errors: string[] }> {
    const adminConfigs = this.getAdminConfigs();
    const keys = Object.keys(adminConfigs);
    let syncedCount = 0;
    const errors: string[] = [];

    for (const key of keys) {
      try {
        const result = await this.saveAdminConfig(key, adminConfigs[key]);
        if (result.success) {
          syncedCount++;
        } else {
          errors.push(`${key}: ${result.error}`);
        }
      } catch (error) {
        errors.push(`${key}: ${error instanceof Error ? error.message : 'Unknown error'}`);
      }
    }

    console.log(`🔄 Force sync completed: ${syncedCount}/${keys.length} configurations synced`);
    return { synced: syncedCount, total: keys.length, errors };
  }

  /**
   * Check if global services can access admin configurations
   */
  static async verifyGlobalAccess(): Promise<{ 
    openAI: { accessible: boolean; configured: boolean; working: boolean; error?: string } 
  }> {
    const result = {
      openAI: { accessible: false, configured: false, working: false, error: undefined as string | undefined }
    };

    try {
      // Check if global OpenAI service can access configuration
      result.openAI.configured = globalOpenAI.isConfigured();
      
      if (result.openAI.configured) {
        result.openAI.accessible = true;
        result.openAI.working = await globalOpenAI.testConnection();
      } else {
        result.openAI.error = 'No API key configured in global service';
      }

    } catch (error) {
      result.openAI.error = error instanceof Error ? error.message : 'Unknown error';
    }

    return result;
  }

  /**
   * Get health summary including sync status
   */
  static async getHealthSummary(): Promise<{
    adminConfigured: number;
    globalSynced: number;
    totalServices: number;
    syncErrors: string[];
    lastSyncAttempt?: string;
  }> {
    const adminConfigs = this.getAdminConfigs();
    const syncStatus = this.getSyncStatus();
    const globalAccess = await this.verifyGlobalAccess();

    const adminConfigured = Object.keys(adminConfigs).filter(key => adminConfigs[key] && adminConfigs[key].length > 10).length;
    const globalSynced = Object.values(globalAccess).filter(service => service.accessible && service.working).length;
    const totalServices = Object.keys(globalAccess).length;

    const syncErrors: string[] = [];
    Object.entries(syncStatus).forEach(([key, status]) => {
      if (!status.success) {
        syncErrors.push(`${key}: Last sync failed`);
      }
    });

    const lastSyncTimes = Object.values(syncStatus).map(s => new Date(s.lastSync).getTime());
    const lastSyncAttempt = lastSyncTimes.length > 0 
      ? new Date(Math.max(...lastSyncTimes)).toISOString()
      : undefined;

    return {
      adminConfigured,
      globalSynced,
      totalServices,
      syncErrors,
      lastSyncAttempt
    };
  }
}

// Export singleton instance
export const adminGlobalSync = AdminGlobalConfigSync;
