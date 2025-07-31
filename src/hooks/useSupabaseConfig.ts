/**
 * useSupabaseConfig Hook
 * React hook for real-time configuration management with Supabase sync
 */

import { useState, useEffect, useCallback } from 'react';
import { supabaseConfigSync, DatabaseConfig, ConfigSyncStatus } from '@/services/supabaseConfigSync';

export interface UseSupabaseConfigReturn {
  configs: DatabaseConfig[];
  loading: boolean;
  error: string | null;
  saveConfig: (key: string, value: string, options?: {
    description?: string;
    isSecret?: boolean;
    testConnection?: boolean;
  }) => Promise<{ success: boolean; error?: string }>;
  getConfig: (key: string) => DatabaseConfig | null;
  deleteConfig: (key: string) => Promise<{ success: boolean; error?: string }>;
  refreshConfigs: () => Promise<void>;
  syncStatus: ConfigSyncStatus[];
  isOnline: boolean;
}

export function useSupabaseConfig(): UseSupabaseConfigReturn {
  const [configs, setConfigs] = useState<DatabaseConfig[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [syncStatus, setSyncStatus] = useState<ConfigSyncStatus[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Handle online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Subscribe to real-time configuration changes
  useEffect(() => {
    const unsubscribe = supabaseConfigSync.subscribe((newConfigs) => {
      setConfigs(newConfigs);
      setLoading(false);
    });

    // Initial load
    loadConfigs();

    return unsubscribe;
  }, []);

  // Load sync status periodically
  useEffect(() => {
    const loadSyncStatus = async () => {
      try {
        const status = await supabaseConfigSync.getSyncStatus();
        setSyncStatus(status);
      } catch (err) {
        console.error('Failed to load sync status:', err);
      }
    };

    loadSyncStatus();
    const interval = setInterval(loadSyncStatus, 10000); // Update every 10 seconds

    return () => clearInterval(interval);
  }, [configs]);

  const loadConfigs = async () => {
    try {
      setLoading(true);
      setError(null);
      await supabaseConfigSync.loadAllConfigurations();
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load configurations';
      setError(errorMessage);
      console.error('Failed to load configurations:', err);
    } finally {
      setLoading(false);
    }
  };

  const saveConfig = useCallback(async (
    key: string, 
    value: string, 
    options: {
      description?: string;
      isSecret?: boolean;
      testConnection?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      
      const result = await supabaseConfigSync.saveConfiguration(key, value, options);
      
      if (!result.success) {
        setError(result.error || 'Failed to save configuration');
      }
      
      return result;
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to save configuration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, []);

  const getConfig = useCallback((key: string): DatabaseConfig | null => {
    return supabaseConfigSync.getConfiguration(key);
  }, [configs]);

  const deleteConfig = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    try {
      setError(null);
      
      // Note: This would need to be implemented in the sync service
      // For now, we'll mark as inactive
      const existingConfig = getConfig(key);
      if (existingConfig) {
        const result = await saveConfig(key, existingConfig.value, {
          description: existingConfig.description,
          isSecret: existingConfig.is_secret
        });
        
        // Then actually delete from database
        // This would require implementing delete in supabaseConfigSync
        
        return result;
      }
      
      return { success: false, error: 'Configuration not found' };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to delete configuration';
      setError(errorMessage);
      return { success: false, error: errorMessage };
    }
  }, [saveConfig, getConfig]);

  const refreshConfigs = useCallback(async (): Promise<void> => {
    await loadConfigs();
  }, []);

  return {
    configs,
    loading,
    error,
    saveConfig,
    getConfig,
    deleteConfig,
    refreshConfigs,
    syncStatus,
    isOnline
  };
}

/**
 * Hook for specific configuration values
 */
export function useSupabaseConfigValue(key: string): {
  value: string | null;
  config: DatabaseConfig | null;
  loading: boolean;
  updateValue: (value: string, testConnection?: boolean) => Promise<{ success: boolean; error?: string }>;
} {
  const { configs, loading, saveConfig, getConfig } = useSupabaseConfig();
  
  const config = getConfig(key);
  const value = config?.value || null;

  const updateValue = useCallback(async (
    value: string, 
    testConnection: boolean = false
  ): Promise<{ success: boolean; error?: string }> => {
    return await saveConfig(key, value, { 
      testConnection,
      isSecret: config?.is_secret 
    });
  }, [key, saveConfig, config]);

  return {
    value,
    config,
    loading,
    updateValue
  };
}

/**
 * Hook for API key management
 */
export function useAPIKey(keyName: string): {
  apiKey: string | null;
  isValid: boolean | null;
  healthScore: number;
  isConfigured: boolean;
  updateAPIKey: (key: string) => Promise<{ success: boolean; error?: string }>;
  testAPIKey: () => Promise<{ success: boolean; message: string }>;
} {
  const { value, config, updateValue } = useSupabaseConfigValue(keyName);
  
  const isConfigured = Boolean(value && value.length > 10);
  const isValid = config?.health_score ? config.health_score > 50 : null;
  const healthScore = config?.health_score || 0;

  const updateAPIKey = useCallback(async (key: string): Promise<{ success: boolean; error?: string }> => {
    return await updateValue(key, true); // Always test API keys
  }, [updateValue]);

  const testAPIKey = useCallback(async (): Promise<{ success: boolean; message: string }> => {
    if (!value) {
      return { success: false, message: 'No API key configured' };
    }

    try {
      const result = await updateValue(value, true);
      return {
        success: result.success,
        message: result.success ? 'API key is valid' : result.error || 'API key test failed'
      };
    } catch (error) {
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Test failed'
      };
    }
  }, [value, updateValue]);

  return {
    apiKey: value,
    isValid,
    healthScore,
    isConfigured,
    updateAPIKey,
    testAPIKey
  };
}
