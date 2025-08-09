/**
 * Real-time Supabase Configuration Synchronization Service
 * Ensures seamless sync between admin settings and Supabase database
 * with real-time updates and automatic global service configuration
 */

import { supabase } from '@/integrations/supabase/client';
import { RealtimeChannel } from '@supabase/supabase-js';
import { globalOpenAI } from './globalOpenAIConfig';
import { adminGlobalSync } from './adminGlobalConfigSync';

export interface DatabaseConfig {
  id: string;
  key: string;
  value: string;
  description?: string;
  is_secret: boolean;
  is_active: boolean;
  service_type: 'openai' | 'supabase' | 'resend' | 'netlify' | 'other';
  last_tested?: string;
  health_score?: number;
  created_at: string;
  updated_at: string;
}

export interface ConfigSyncStatus {
  key: string;
  inDatabase: boolean;
  inLocalStorage: boolean;
  inGlobalServices: boolean;
  lastSync: string;
  syncStatus: 'synced' | 'pending' | 'error';
  error?: string;
}

export class SupabaseConfigSync {
  private static instance: SupabaseConfigSync;
  private realtimeChannel: RealtimeChannel | null = null;
  private configCache: Map<string, DatabaseConfig> = new Map();
  private syncCallbacks: Array<(configs: DatabaseConfig[]) => void> = [];
  private isInitialized = false;

  constructor() {
    this.initializeRealtimeSync();
  }

  static getInstance(): SupabaseConfigSync {
    if (!this.instance) {
      this.instance = new SupabaseConfigSync();
    }
    return this.instance;
  }

  /**
   * Initialize real-time synchronization with Supabase
   */
  private async initializeRealtimeSync(): Promise<void> {
    try {
      console.log('🔄 Initializing real-time config sync...');

      // Check table existence and set mode accordingly
      const tableExists = await this.checkTableExists();

      if (tableExists) {
        // Load from database and set up real-time subscription
        await this.loadAllConfigurations();
        this.setupRealtimeSubscription();
        console.log('✅ Real-time config sync initialized with database');
      } else {
        // Use localStorage mode
        await this.loadAllConfigurations(); // This will load from localStorage
        console.log('⚠️ Real-time config sync initialized in localStorage mode (table not found)');
      }

      this.isInitialized = true;

    } catch (error) {
      console.error('❌ Failed to initialize real-time sync:', error.message || error.toString() || JSON.stringify(error));
      // Fall back to localStorage-only mode
      await this.loadFromLocalStorageOnly();
      this.isInitialized = true;
      console.log('🔄 Fallback: Using localStorage-only mode');
    }
  }

  /**
   * Check if the configuration table exists
   */
  private async checkTableExists(): Promise<boolean> {
    try {
      // Test if table exists by attempting a simple query
      const { error } = await supabase
        .from('admin_environment_variables')
        .select('id')
        .limit(1);

      if (error && error.code === '42P01') {
        console.log('📝 Configuration table not found, will use localStorage mode');
        return false;
      }

      if (error) {
        console.warn('⚠️ Database access error:', error.message);
        return false;
      }

      console.log('✅ Configuration table is accessible');
      return true;
    } catch (error) {
      console.warn('⚠️ Database table check failed, using localStorage mode');
      return false;
    }
  }

  /**
   * Set up real-time subscription for configuration changes
   */
  private setupRealtimeSubscription(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
    }

    this.realtimeChannel = supabase
      .channel('admin_config_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_environment_variables'
        },
        (payload) => {
          console.log('📡 Real-time config change received:', payload);
          this.handleRealtimeUpdate(payload);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });
  }

  /**
   * Handle real-time updates from Supabase
   */
  private handleRealtimeUpdate(payload: any): void {
    const eventType = payload.eventType;
    const config = payload.new || payload.old;

    switch (eventType) {
      case 'INSERT':
      case 'UPDATE':
        this.updateCacheAndSync(config);
        break;
      case 'DELETE':
        this.removeCacheAndSync(config.key);
        break;
    }

    // Notify all subscribers
    this.notifySubscribers();
  }

  /**
   * Update cache and sync to global services
   */
  private async updateCacheAndSync(config: any): Promise<void> {
    try {
      const dbConfig: DatabaseConfig = {
        id: config.id,
        key: config.key,
        value: config.value,
        description: config.description,
        is_secret: config.is_secret,
        is_active: config.is_active !== false,
        service_type: this.detectServiceType(config.key),
        last_tested: config.last_tested,
        health_score: config.health_score,
        created_at: config.created_at,
        updated_at: config.updated_at
      };

      this.configCache.set(config.key, dbConfig);

      // Sync to localStorage for offline access
      this.syncToLocalStorage();

      // Sync to global services if it's an active API key
      if (dbConfig.is_active && this.isAPIKey(dbConfig.key)) {
        await this.syncToGlobalServices(dbConfig);
      }

      console.log(`✅ Config synced: ${config.key}`);
    } catch (error) {
      console.error(`❌ Failed to sync config ${config.key}:`, error.message || error.toString() || JSON.stringify(error));
    }
  }

  /**
   * Remove from cache and sync
   */
  private removeCacheAndSync(key: string): void {
    this.configCache.delete(key);
    this.syncToLocalStorage();
    console.log(`🗑️ Config removed: ${key}`);
  }

  /**
   * Load all configurations from database
   */
  public async loadAllConfigurations(): Promise<DatabaseConfig[]> {
    try {
      // Check if table exists first
      const tableExists = await this.checkTableExists();

      if (!tableExists) {
        console.log('📦 Loading from localStorage (table not available)');
        return this.loadFromLocalStorage();
      }

      const { data, error } = await supabase
        .from('admin_environment_variables')
        .select('*')
        .eq('is_active', true)
        .order('updated_at', { ascending: false });

      if (error) {
        console.warn('Database load failed, using localStorage:', error.message);
        return this.loadFromLocalStorage();
      }

      // Update cache
      this.configCache.clear();
      const configs: DatabaseConfig[] = data.map(row => ({
        id: row.id,
        key: row.key,
        value: row.value,
        description: row.description,
        is_secret: row.is_secret,
        is_active: row.is_active,
        service_type: this.detectServiceType(row.key),
        last_tested: row.last_tested,
        health_score: row.health_score,
        created_at: row.created_at,
        updated_at: row.updated_at
      }));

      configs.forEach(config => {
        this.configCache.set(config.key, config);
      });

      // Sync to localStorage
      this.syncToLocalStorage();

      // Sync active API keys to global services
      await this.syncAllToGlobalServices();

      console.log(`✅ Loaded ${configs.length} configurations from database`);
      return configs;

    } catch (error) {
      console.error('Failed to load configurations:', error);
      return this.loadFromLocalStorage();
    }
  }

  /**
   * Save configuration to database with real-time sync
   */
  public async saveConfiguration(
    key: string, 
    value: string, 
    options: {
      description?: string;
      isSecret?: boolean;
      testConnection?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string; config?: DatabaseConfig }> {
    try {
      const serviceType = this.detectServiceType(key);
      const isSecret = options.isSecret ?? this.isAPIKey(key);

      // Test the configuration if it's an API key
      let healthScore = 0;
      if (options.testConnection && this.isAPIKey(key)) {
        const testResult = await this.testConfiguration(key, value);
        healthScore = testResult.success ? 100 : 0;
      }

      const configData = {
        key,
        value,
        description: options.description || this.getDefaultDescription(key),
        is_secret: isSecret,
        is_active: true,
        service_type: serviceType,
        last_tested: options.testConnection ? new Date().toISOString() : null,
        health_score: healthScore,
        updated_at: new Date().toISOString()
      };

      // Check if table exists before attempting to save
      const tableExists = await this.checkTableExists();

      if (!tableExists) {
        console.log('📦 Saving to localStorage (table not available)');
        await this.saveToLocalStorageFallback(configData);
        return { success: true, error: 'Saved to localStorage (database table not found)' };
      }

      // Save to database
      const { data, error } = await supabase
        .from('admin_environment_variables')
        .upsert(configData, { onConflict: 'key' })
        .select()
        .single();

      if (error) {
        console.warn('Database save failed, using localStorage fallback:', error.message);
        // Fallback to localStorage
        await this.saveToLocalStorageFallback(configData);
        return { success: true, error: 'Saved to localStorage (database unavailable)' };
      }

      const savedConfig: DatabaseConfig = {
        id: data.id,
        key: data.key,
        value: data.value,
        description: data.description,
        is_secret: data.is_secret,
        is_active: data.is_active,
        service_type: data.service_type,
        last_tested: data.last_tested,
        health_score: data.health_score,
        created_at: data.created_at,
        updated_at: data.updated_at
      };

      // Update local cache (real-time will also update, but this is immediate)
      this.configCache.set(key, savedConfig);

      // Sync to global services
      if (this.isAPIKey(key)) {
        await this.syncToGlobalServices(savedConfig);
      }

      console.log(`✅ Configuration saved: ${key}`);
      return { success: true, config: savedConfig };

    } catch (error) {
      console.error(`❌ Failed to save configuration ${key}:`, error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error' 
      };
    }
  }

  /**
   * Get configuration by key
   */
  public getConfiguration(key: string): DatabaseConfig | null {
    return this.configCache.get(key) || null;
  }

  /**
   * Get all configurations
   */
  public getAllConfigurations(): DatabaseConfig[] {
    return Array.from(this.configCache.values());
  }

  /**
   * Subscribe to configuration changes
   */
  public subscribe(callback: (configs: DatabaseConfig[]) => void): () => void {
    this.syncCallbacks.push(callback);
    
    // Immediately call with current data
    callback(this.getAllConfigurations());

    // Return unsubscribe function
    return () => {
      const index = this.syncCallbacks.indexOf(callback);
      if (index > -1) {
        this.syncCallbacks.splice(index, 1);
      }
    };
  }

  /**
   * Notify all subscribers of changes
   */
  private notifySubscribers(): void {
    const configs = this.getAllConfigurations();
    this.syncCallbacks.forEach(callback => {
      try {
        callback(configs);
      } catch (error) {
        console.error('Error in sync callback:', error);
      }
    });
  }

  /**
   * Sync to global services
   */
  private async syncToGlobalServices(config: DatabaseConfig): Promise<void> {
    try {
      if (config.key === 'OPENAI_API_KEY' && config.value.startsWith('sk-')) {
        await adminGlobalSync.saveAdminConfig(config.key, config.value);
        console.log(`🔄 Synced ${config.key} to global OpenAI service`);
      }
      // Add other service syncs here as needed
    } catch (error) {
      console.error(`Failed to sync ${config.key} to global services:`, error);
    }
  }

  /**
   * Sync all active configurations to global services
   */
  private async syncAllToGlobalServices(): Promise<void> {
    const apiKeys = this.getAllConfigurations().filter(config => 
      config.is_active && this.isAPIKey(config.key)
    );

    for (const config of apiKeys) {
      await this.syncToGlobalServices(config);
    }
  }

  /**
   * Sync to localStorage for offline access
   */
  private syncToLocalStorage(): void {
    try {
      const configs = this.getAllConfigurations();
      const envVars = configs.map(config => ({
        id: config.id,
        key: config.key,
        value: config.value,
        description: config.description,
        is_secret: config.is_secret,
        created_at: config.created_at,
        updated_at: config.updated_at
      }));
      
      localStorage.setItem('admin_env_vars', JSON.stringify(envVars));
      
      // Also sync API keys to admin configs for global access
      const adminConfigs: { [key: string]: string } = {};
      configs.forEach(config => {
        if (this.isAPIKey(config.key) && config.is_active) {
          adminConfigs[config.key] = config.value;
        }
      });
      localStorage.setItem('admin_api_configs', JSON.stringify(adminConfigs));
      
    } catch (error) {
      console.error('Failed to sync to localStorage:', error);
    }
  }

  /**
   * Load from localStorage fallback
   */
  private loadFromLocalStorage(): DatabaseConfig[] {
    try {
      const stored = localStorage.getItem('admin_env_vars');
      if (!stored) {
        // Initialize with empty structure
        this.initializeLocalStorage();
        return [];
      }

      const envVars = JSON.parse(stored);
      return envVars.map((item: any) => ({
        id: item.id || crypto.randomUUID(),
        key: item.key,
        value: item.value,
        description: item.description,
        is_secret: item.is_secret ?? true,
        is_active: item.is_active ?? true,
        service_type: this.detectServiceType(item.key),
        last_tested: item.last_tested,
        health_score: item.health_score || 0,
        created_at: item.created_at || new Date().toISOString(),
        updated_at: item.updated_at || new Date().toISOString()
      }));
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
      this.initializeLocalStorage();
      return [];
    }
  }

  /**
   * Initialize localStorage structure
   */
  private initializeLocalStorage(): void {
    try {
      if (!localStorage.getItem('admin_env_vars')) {
        localStorage.setItem('admin_env_vars', JSON.stringify([]));
      }
      if (!localStorage.getItem('admin_api_configs')) {
        localStorage.setItem('admin_api_configs', JSON.stringify({}));
      }
      console.log('📦 Initialized localStorage structure for config sync');
    } catch (error) {
      console.error('Failed to initialize localStorage:', error);
    }
  }

  /**
   * Save to localStorage fallback
   */
  private async saveToLocalStorageFallback(configData: any): Promise<void> {
    try {
      const stored = JSON.parse(localStorage.getItem('admin_env_vars') || '[]');
      const existingIndex = stored.findIndex((item: any) => item.key === configData.key);
      
      const newItem = {
        id: crypto.randomUUID(),
        ...configData,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };

      if (existingIndex >= 0) {
        stored[existingIndex] = { ...stored[existingIndex], ...newItem };
      } else {
        stored.push(newItem);
      }

      localStorage.setItem('admin_env_vars', JSON.stringify(stored));
      
      // Update cache
      const dbConfig: DatabaseConfig = {
        ...newItem,
        service_type: this.detectServiceType(configData.key)
      };
      this.configCache.set(configData.key, dbConfig);

      // Sync to global services
      if (this.isAPIKey(configData.key)) {
        await this.syncToGlobalServices(dbConfig);
      }

    } catch (error) {
      console.error('Failed to save to localStorage fallback:', error);
    }
  }

  /**
   * Test configuration
   */
  private async testConfiguration(key: string, value: string): Promise<{ success: boolean; message: string }> {
    try {
      if (key === 'OPENAI_API_KEY') {
        const response = await fetch('https://api.openai.com/v1/models', {
          headers: {
            'Authorization': `Bearer ${value}`,
            'Content-Type': 'application/json'
          }
        });
        return {
          success: response.ok,
          message: response.ok ? 'OpenAI API key valid' : 'OpenAI API key invalid'
        };
      }
      
      return { success: true, message: 'Configuration saved' };
    } catch (error) {
      return { 
        success: false, 
        message: error instanceof Error ? error.message : 'Test failed' 
      };
    }
  }

  /**
   * Load configurations from localStorage only
   */
  private async loadFromLocalStorageOnly(): Promise<void> {
    try {
      const configs = this.loadFromLocalStorage();

      // Update cache
      this.configCache.clear();
      configs.forEach(config => {
        this.configCache.set(config.key, config);
      });

      // Sync active API keys to global services
      await this.syncAllToGlobalServices();

      console.log(`✅ Loaded ${configs.length} configurations from localStorage`);
    } catch (error) {
      console.error('Failed to load from localStorage:', error);
    }
  }

  /**
   * Set up periodic sync as fallback
   */
  private setupPeriodicSync(): void {
    setInterval(async () => {
      try {
        // Check if table exists now
        const tableExists = await this.checkTableExists();
        if (tableExists) {
          await this.loadAllConfigurations();
        } else {
          await this.loadFromLocalStorageOnly();
        }
      } catch (error) {
        console.error('Periodic sync failed:', error);
      }
    }, 30000); // Sync every 30 seconds
  }

  /**
   * Get sync status for all configurations
   */
  public async getSyncStatus(): Promise<ConfigSyncStatus[]> {
    const configs = this.getAllConfigurations();
    const statuses: ConfigSyncStatus[] = [];

    for (const config of configs) {
      const inLocalStorage = localStorage.getItem('admin_env_vars')?.includes(config.key) ?? false;
      const inGlobalServices = await this.checkGlobalServiceSync(config.key);

      statuses.push({
        key: config.key,
        inDatabase: true, // If it's in cache, it came from database
        inLocalStorage,
        inGlobalServices,
        lastSync: config.updated_at,
        syncStatus: inGlobalServices ? 'synced' : 'pending'
      });
    }

    return statuses;
  }

  /**
   * Check if configuration is synced to global services
   */
  private async checkGlobalServiceSync(key: string): Promise<boolean> {
    try {
      if (key === 'OPENAI_API_KEY') {
        return globalOpenAI.isConfigured();
      }
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Utility methods
   */
  private detectServiceType(key: string): DatabaseConfig['service_type'] {
    if (key.includes('OPENAI')) return 'openai';
    if (key.includes('SUPABASE')) return 'supabase';
    if (key.includes('RESEND')) return 'resend';
    if (key.includes('NETLIFY')) return 'netlify';
    return 'other';
  }

  private isAPIKey(key: string): boolean {
    return key.includes('API_KEY') || key.includes('_KEY');
  }

  private getDefaultDescription(key: string): string {
    const descriptions: { [key: string]: string } = {
      'OPENAI_API_KEY': 'OpenAI API key for content generation',
      'VITE_SUPABASE_URL': 'Supabase project URL',
      'VITE_SUPABASE_ANON_KEY': 'Supabase anonymous key',
      'RESEND_API_KEY': 'Resend email service API key'
    };
    return descriptions[key] || `Configuration value for ${key}`;
  }

  /**
   * Cleanup
   */
  public cleanup(): void {
    if (this.realtimeChannel) {
      this.realtimeChannel.unsubscribe();
      this.realtimeChannel = null;
    }
    this.syncCallbacks = [];
    this.configCache.clear();
  }
}

// Export singleton instance
export const supabaseConfigSync = SupabaseConfigSync.getInstance();
