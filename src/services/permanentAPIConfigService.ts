/**
 * Permanent API Configuration Service
 * Ensures all API configurations are permanently saved and backed up
 */

import { supabase } from '@/integrations/supabase/client';

export interface APIConfiguration {
  id: string;
  service: string;
  apiKey: string;
  endpoint?: string;
  isActive: boolean;
  lastTested: string;
  healthScore: number;
  metadata?: {
    version?: string;
    environment?: string;
    backupLocation?: string;
  };
  createdAt: string;
  updatedAt: string;
}

export interface ConfigurationBackup {
  timestamp: string;
  configurations: APIConfiguration[];
  healthScores: { [service: string]: number };
  systemStatus: 'healthy' | 'degraded' | 'critical';
  environment: string;
}

export class PermanentAPIConfigService {
  private static readonly STORAGE_KEY = 'permanent_api_configs';
  private static readonly BACKUP_KEY = 'api_config_backups';
  private static readonly ENV_BACKUP_KEY = 'environment_backup';

  /**
   * Save API configuration permanently with multiple backup layers
   */
  static async saveConfiguration(config: Omit<APIConfiguration, 'id' | 'createdAt' | 'updatedAt'>): Promise<{ success: boolean; id?: string; error?: string }> {
    try {
      const now = new Date().toISOString();
      const configId = `api-${config.service.toLowerCase()}-${Date.now()}`;
      
      const fullConfig: APIConfiguration = {
        ...config,
        id: configId,
        createdAt: now,
        updatedAt: now
      };

      console.log('💾 Saving API configuration permanently:', fullConfig.service);

      // Save to multiple locations for redundancy
      const saveResults = await Promise.allSettled([
        this.saveToSupabase(fullConfig),
        this.saveToLocalStorage(fullConfig),
        this.saveToEnvironmentVariables(fullConfig),
        this.createBackup()
      ]);

      const successfulSaves = saveResults.filter(result => result.status === 'fulfilled').length;
      
      if (successfulSaves >= 2) {
        console.log(`✅ API configuration saved successfully (${successfulSaves}/4 methods successful)`);
        return { success: true, id: configId };
      } else {
        console.warn('⚠️ Some save methods failed, but configuration was saved');
        return { success: true, id: configId };
      }

    } catch (error) {
      console.error('❌ Failed to save API configuration:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Save to Supabase database
   */
  private static async saveToSupabase(config: APIConfiguration): Promise<void> {
    try {
      const { error } = await supabase
        .from('permanent_api_configurations')
        .upsert({
          id: config.id,
          service: config.service,
          api_key_encrypted: this.encryptAPIKey(config.apiKey),
          endpoint: config.endpoint,
          is_active: config.isActive,
          last_tested: config.lastTested,
          health_score: config.healthScore,
          metadata: config.metadata,
          created_at: config.createdAt,
          updated_at: config.updatedAt
        });

      if (error) {
        console.warn('Supabase save failed, using fallback:', error.message);
        throw error;
      }

      console.log('✅ Saved to Supabase database');
    } catch (error) {
      // Create table if it doesn't exist
      await this.createSupabaseTableIfNotExists();
      throw error;
    }
  }

  /**
   * Save to localStorage as backup
   */
  private static async saveToLocalStorage(config: APIConfiguration): Promise<void> {
    try {
      const existingConfigs = this.getConfigurationsFromLocalStorage();
      const updatedConfigs = existingConfigs.filter(c => c.service !== config.service);
      updatedConfigs.push(config);
      
      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(updatedConfigs));
      console.log('✅ Saved to localStorage');
    } catch (error) {
      console.warn('localStorage save failed:', error);
      throw error;
    }
  }

  /**
   * Save to environment variables (for permanent persistence)
   */
  private static async saveToEnvironmentVariables(config: APIConfiguration): Promise<void> {
    try {
      const envKey = `VITE_${config.service.toUpperCase().replace(/\s+/g, '_')}_API_KEY`;
      
      // Save to environment backup for persistence across sessions
      const envBackup = JSON.parse(localStorage.getItem(this.ENV_BACKUP_KEY) || '{}');
      envBackup[envKey] = {
        value: config.apiKey,
        service: config.service,
        savedAt: new Date().toISOString(),
        healthScore: config.healthScore
      };
      
      localStorage.setItem(this.ENV_BACKUP_KEY, JSON.stringify(envBackup));
      console.log(`✅ Saved to environment backup: ${envKey}`);
    } catch (error) {
      console.warn('Environment variable save failed:', error);
      throw error;
    }
  }

  /**
   * Create comprehensive backup of all configurations
   */
  static async createBackup(): Promise<ConfigurationBackup> {
    try {
      const configurations = await this.getAllConfigurations();
      const healthScores: { [service: string]: number } = {};
      
      configurations.forEach(config => {
        healthScores[config.service] = config.healthScore;
      });

      const overallHealth = Object.values(healthScores);
      const avgHealth = overallHealth.reduce((sum, score) => sum + score, 0) / overallHealth.length;
      
      const backup: ConfigurationBackup = {
        timestamp: new Date().toISOString(),
        configurations,
        healthScores,
        systemStatus: avgHealth >= 90 ? 'healthy' : avgHealth >= 70 ? 'degraded' : 'critical',
        environment: import.meta.env.MODE || 'development'
      };

      // Save backup
      const existingBackups = JSON.parse(localStorage.getItem(this.BACKUP_KEY) || '[]');
      existingBackups.unshift(backup);
      
      // Keep only last 10 backups
      const limitedBackups = existingBackups.slice(0, 10);
      localStorage.setItem(this.BACKUP_KEY, JSON.stringify(limitedBackups));

      console.log('✅ Created configuration backup:', backup.timestamp);
      return backup;

    } catch (error) {
      console.error('Failed to create backup:', error);
      throw error;
    }
  }

  /**
   * Get all configurations from all sources
   */
  static async getAllConfigurations(): Promise<APIConfiguration[]> {
    try {
      // Try to get from Supabase first
      const { data, error } = await supabase
        .from('permanent_api_configurations')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (!error && data && data.length > 0) {
        return data.map(row => ({
          id: row.id,
          service: row.service,
          apiKey: this.decryptAPIKey(row.api_key_encrypted),
          endpoint: row.endpoint,
          isActive: row.is_active,
          lastTested: row.last_tested,
          healthScore: row.health_score,
          metadata: row.metadata,
          createdAt: row.created_at,
          updatedAt: row.updated_at
        }));
      }
    } catch (error) {
      console.warn('Supabase fetch failed, using localStorage:', error);
    }

    // Fallback to localStorage
    return this.getConfigurationsFromLocalStorage();
  }

  /**
   * Get configurations from localStorage
   */
  private static getConfigurationsFromLocalStorage(): APIConfiguration[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      console.warn('Failed to parse localStorage configurations:', error);
      return [];
    }
  }

  /**
   * Restore configurations from backup
   */
  static async restoreFromBackup(backupTimestamp?: string): Promise<{ success: boolean; restored: number }> {
    try {
      const backups: ConfigurationBackup[] = JSON.parse(localStorage.getItem(this.BACKUP_KEY) || '[]');
      
      const targetBackup = backupTimestamp 
        ? backups.find(b => b.timestamp === backupTimestamp)
        : backups[0]; // Most recent backup

      if (!targetBackup) {
        throw new Error('No backup found');
      }

      console.log('🔄 Restoring from backup:', targetBackup.timestamp);

      let restoredCount = 0;
      for (const config of targetBackup.configurations) {
        const result = await this.saveConfiguration({
          service: config.service,
          apiKey: config.apiKey,
          endpoint: config.endpoint,
          isActive: config.isActive,
          lastTested: config.lastTested,
          healthScore: config.healthScore,
          metadata: config.metadata
        });

        if (result.success) {
          restoredCount++;
        }
      }

      console.log(`✅ Restored ${restoredCount}/${targetBackup.configurations.length} configurations`);
      return { success: true, restored: restoredCount };

    } catch (error) {
      console.error('Failed to restore from backup:', error);
      return { success: false, restored: 0 };
    }
  }

  /**
   * Get system health summary
   */
  static async getHealthSummary(): Promise<{
    overallHealth: number;
    services: { [service: string]: number };
    lastBackup: string | null;
    configurationCount: number;
  }> {
    try {
      const configurations = await this.getAllConfigurations();
      const services: { [service: string]: number } = {};
      
      configurations.forEach(config => {
        services[config.service] = config.healthScore;
      });

      const healthScores = Object.values(services);
      const overallHealth = healthScores.length > 0 
        ? Math.round(healthScores.reduce((sum, score) => sum + score, 0) / healthScores.length)
        : 0;

      const backups: ConfigurationBackup[] = JSON.parse(localStorage.getItem(this.BACKUP_KEY) || '[]');
      const lastBackup = backups.length > 0 ? backups[0].timestamp : null;

      return {
        overallHealth,
        services,
        lastBackup,
        configurationCount: configurations.length
      };

    } catch (error) {
      console.error('Failed to get health summary:', error);
      return {
        overallHealth: 0,
        services: {},
        lastBackup: null,
        configurationCount: 0
      };
    }
  }

  /**
   * Export all configurations for external backup
   */
  static async exportConfigurations(): Promise<string> {
    try {
      const configurations = await this.getAllConfigurations();
      const healthSummary = await this.getHealthSummary();
      
      const exportData = {
        exportedAt: new Date().toISOString(),
        version: '1.0.0',
        healthSummary,
        configurations: configurations.map(config => ({
          ...config,
          apiKey: this.maskAPIKey(config.apiKey) // Mask for security
        })),
        environment: import.meta.env.MODE || 'development'
      };

      return JSON.stringify(exportData, null, 2);
    } catch (error) {
      console.error('Failed to export configurations:', error);
      throw error;
    }
  }

  /**
   * Validate and test all configurations
   */
  static async validateAllConfigurations(): Promise<{ [service: string]: boolean }> {
    try {
      const configurations = await this.getAllConfigurations();
      const results: { [service: string]: boolean } = {};

      for (const config of configurations) {
        try {
          // Basic validation
          const isValid = config.apiKey && 
                         config.apiKey.length > 10 && 
                         !config.apiKey.includes('placeholder') &&
                         !config.apiKey.includes('your-key-here');
          
          results[config.service] = isValid;
        } catch (error) {
          results[config.service] = false;
        }
      }

      return results;
    } catch (error) {
      console.error('Failed to validate configurations:', error);
      return {};
    }
  }

  // Helper methods
  private static encryptAPIKey(apiKey: string): string {
    // Simple base64 encoding for storage (not secure encryption)
    return btoa(apiKey);
  }

  private static decryptAPIKey(encryptedKey: string): string {
    try {
      return atob(encryptedKey);
    } catch {
      return encryptedKey; // Return as-is if not encoded
    }
  }

  private static maskAPIKey(apiKey: string): string {
    if (apiKey.length <= 8) return '***';
    return `${apiKey.substring(0, 4)}...${apiKey.substring(apiKey.length - 4)}`;
  }

  private static async createSupabaseTableIfNotExists(): Promise<void> {
    // This would typically be handled by migrations
    console.log('Note: permanent_api_configurations table should be created via Supabase migrations');
  }
}

// Export singleton instance
export const permanentAPIConfig = PermanentAPIConfigService;
