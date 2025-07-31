/**
 * Automatic Configuration Saver
 * Automatically saves API configurations when optimal health is detected
 */

import { globalOpenAI } from './globalOpenAIConfig';
import { permanentAPIConfig } from './permanentAPIConfigService';

export class AutoConfigSaver {
  private static instance: AutoConfigSaver;
  private healthCheckInterval: NodeJS.Timeout | null = null;
  private lastHealthScore = 0;
  private saveCallbacks: Array<(score: number) => void> = [];

  static getInstance(): AutoConfigSaver {
    if (!AutoConfigSaver.instance) {
      AutoConfigSaver.instance = new AutoConfigSaver();
    }
    return AutoConfigSaver.instance;
  }

  /**
   * Start monitoring API health and auto-save when optimal
   */
  startMonitoring(intervalMs: number = 30000): void {
    if (this.healthCheckInterval) {
      this.stopMonitoring();
    }

    console.log('🔍 Starting automatic configuration monitoring...');
    
    this.healthCheckInterval = setInterval(async () => {
      await this.checkAndSave();
    }, intervalMs);

    // Initial check
    this.checkAndSave();
  }

  /**
   * Stop monitoring
   */
  stopMonitoring(): void {
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval);
      this.healthCheckInterval = null;
      console.log('⏹️ Stopped automatic configuration monitoring');
    }
  }

  /**
   * Add callback for health score changes
   */
  onHealthChange(callback: (score: number) => void): void {
    this.saveCallbacks.push(callback);
  }

  /**
   * Check health and save if optimal
   */
  private async checkAndSave(): Promise<void> {
    try {
      const healthStatus = await globalOpenAI.getHealthStatus();
      const currentScore = healthStatus.healthScore;

      // Notify callbacks of health change
      if (currentScore !== this.lastHealthScore) {
        this.saveCallbacks.forEach(callback => callback(currentScore));
        this.lastHealthScore = currentScore;
      }

      // Auto-save when health reaches 100%
      if (currentScore === 100 && this.lastHealthScore !== 100) {
        console.log('🎉 Perfect health detected! Auto-saving configuration...');
        await this.saveOptimalConfiguration();
      }

      // Auto-save when health first becomes good (>= 90%)
      if (currentScore >= 90 && this.lastHealthScore < 90) {
        console.log('✅ Good health detected! Auto-saving configuration...');
        await this.saveOptimalConfiguration();
      }

    } catch (error) {
      // Handle fetch errors gracefully without spamming console
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // Skip logging for expected network errors in development
        return;
      }
      console.warn('Health check failed:', error.message);
    }
  }

  /**
   * Save configuration when optimal health is detected
   */
  private async saveOptimalConfiguration(): Promise<void> {
    try {
      // Save via global OpenAI service
      const saveResult = await globalOpenAI.savePermanently();
      
      if (saveResult.success) {
        // Create comprehensive backup
        await permanentAPIConfig.createBackup();
        
        // Log success
        console.log('✅ Optimal configuration auto-saved successfully!');
        
        // Show user notification if possible
        if (typeof window !== 'undefined' && 'Notification' in window) {
          if (Notification.permission === 'granted') {
            new Notification('API Configuration Saved', {
              body: 'Your optimal API configuration has been automatically saved!',
              icon: '/favicon.svg'
            });
          }
        }

        // Store success in localStorage for UI feedback
        localStorage.setItem('auto_save_status', JSON.stringify({
          success: true,
          timestamp: new Date().toISOString(),
          healthScore: this.lastHealthScore
        }));

      } else {
        console.error('Auto-save failed:', saveResult.error);
        
        // Store failure for UI feedback
        localStorage.setItem('auto_save_status', JSON.stringify({
          success: false,
          error: saveResult.error,
          timestamp: new Date().toISOString(),
          healthScore: this.lastHealthScore
        }));
      }

    } catch (error) {
      console.error('Auto-save configuration failed:', error);
    }
  }

  /**
   * Force save current configuration
   */
  async forceSave(): Promise<{ success: boolean; error?: string }> {
    try {
      console.log('💾 Force saving current configuration...');
      
      const result = await globalOpenAI.savePermanently();
      if (result.success) {
        await permanentAPIConfig.createBackup();
      }
      
      return result;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Get last auto-save status
   */
  getLastSaveStatus(): {
    success: boolean;
    timestamp?: string;
    healthScore?: number;
    error?: string;
  } | null {
    try {
      const status = localStorage.getItem('auto_save_status');
      return status ? JSON.parse(status) : null;
    } catch {
      return null;
    }
  }

  /**
   * Manual trigger for when user confirms 100% health
   */
  async saveOnUserConfirmation(): Promise<{ success: boolean; error?: string }> {
    console.log('👤 User confirmed optimal health - saving configuration...');
    
    // Force update health score to 100% since user confirmed it
    this.lastHealthScore = 100;
    
    return await this.forceSave();
  }
}

// Export singleton instance
export const autoConfigSaver = AutoConfigSaver.getInstance();

// Auto-start monitoring in browser environment
if (typeof window !== 'undefined') {
  // Start monitoring after a short delay to ensure everything is loaded
  setTimeout(() => {
    autoConfigSaver.startMonitoring();
  }, 5000);
}
