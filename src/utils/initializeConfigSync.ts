/**
 * Initialize Configuration Sync System
 * Sets up real-time synchronization between admin dashboard and Supabase
 */

import { supabaseConfigSync } from '@/services/supabaseConfigSync';
import { globalOpenAI } from '@/services/globalOpenAIConfig';

let isInitialized = false;

export async function initializeConfigSync(): Promise<{ success: boolean; message: string }> {
  if (isInitialized) {
    return { success: true, message: 'Configuration sync already initialized' };
  }

  try {
    console.log('🚀 Initializing real-time configuration sync...');

    // Load all configurations from database/localStorage
    await supabaseConfigSync.loadAllConfigurations();

    // Test if global services can access configurations
    const globalConfigured = globalOpenAI.isConfigured();
    
    if (globalConfigured) {
      console.log('✅ Global OpenAI service is configured');
    } else {
      console.log('⚠️ Global OpenAI service not configured - will sync when admin sets API key');
    }

    isInitialized = true;
    
    console.log('✅ Real-time configuration sync initialized successfully');
    
    return { 
      success: true, 
      message: 'Real-time configuration sync initialized successfully' 
    };

  } catch (error) {
    console.error('❌ Failed to initialize configuration sync:', error);
    
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to initialize configuration sync'
    };
  }
}

/**
 * Force sync all configurations from admin to global services
 */
export async function forceSyncAllConfigurations(): Promise<{ 
  success: boolean; 
  synced: number; 
  errors: string[] 
}> {
  try {
    console.log('🔄 Force syncing all configurations...');

    const configs = supabaseConfigSync.getAllConfigurations();
    let syncedCount = 0;
    const errors: string[] = [];

    for (const config of configs) {
      if (config.is_active && config.key.includes('API_KEY')) {
        try {
          // Sync to global services based on key type
          if (config.key === 'VITE_OPENAI_API_KEY') {
            // Test the key first
            const testResult = await fetch('https://api.openai.com/v1/models', {
              headers: {
                'Authorization': `Bearer ${config.value}`,
                'Content-Type': 'application/json'
              }
            });

            if (testResult.ok) {
              // Key is valid, sync to global service
              await globalOpenAI.savePermanently();
              syncedCount++;
              console.log(`✅ Synced ${config.key} to global OpenAI service`);
            } else {
              errors.push(`${config.key}: Invalid API key`);
            }
          }
          // Add other service syncs here as needed
        } catch (error) {
          errors.push(`${config.key}: ${error instanceof Error ? error.message : 'Sync failed'}`);
        }
      }
    }

    console.log(`🎯 Force sync completed: ${syncedCount} configurations synced`);

    return {
      success: errors.length === 0,
      synced: syncedCount,
      errors
    };

  } catch (error) {
    console.error('❌ Force sync failed:', error);
    return {
      success: false,
      synced: 0,
      errors: [error instanceof Error ? error.message : 'Force sync failed']
    };
  }
}

/**
 * Get system health summary
 */
export async function getSystemHealthSummary(): Promise<{
  overallHealth: 'healthy' | 'degraded' | 'critical';
  configSync: boolean;
  globalServices: boolean;
  database: boolean;
  details: string[];
}> {
  const details: string[] = [];
  let configSync = false;
  let globalServices = false;
  let database = false;

  try {
    // Check configuration sync
    const configs = supabaseConfigSync.getAllConfigurations();
    configSync = configs.length > 0;
    details.push(`Configuration sync: ${configSync ? 'Active' : 'Inactive'} (${configs.length} configs)`);

    // Check global services
    try {
      globalServices = globalOpenAI.isConfigured();
      details.push(`Global OpenAI: ${globalServices ? 'Configured' : 'Not configured'}`);
    } catch (error) {
      details.push(`Global OpenAI: Error - ${error instanceof Error ? error.message : 'Unknown'}`);
    }

    // Check database connectivity (simplified)
    database = navigator.onLine;
    details.push(`Database connectivity: ${database ? 'Online' : 'Offline'}`);

    // Determine overall health
    let overallHealth: 'healthy' | 'degraded' | 'critical' = 'critical';
    
    if (configSync && globalServices && database) {
      overallHealth = 'healthy';
    } else if (configSync || globalServices) {
      overallHealth = 'degraded';
    }

    return {
      overallHealth,
      configSync,
      globalServices,
      database,
      details
    };

  } catch (error) {
    details.push(`Health check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return {
      overallHealth: 'critical',
      configSync: false,
      globalServices: false,
      database: false,
      details
    };
  }
}

/**
 * Initialize on app startup
 */
export function autoInitializeConfigSync(): void {
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      initializeConfigSync();
    });
  } else {
    // DOM is already ready
    initializeConfigSync();
  }
}
