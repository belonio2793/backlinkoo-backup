/**
 * Platform Initializer Service
 * Automatically filters and validates platforms on startup
 * Ensures only working APIs are available for automation
 */

import { automaticUrlFilterService } from './automaticUrlFilterService';
import { targetSitesManager } from './targetSitesManager';
import { automationLogger } from './automationLogger';

class PlatformInitializer {
  private isInitialized = false;
  private initializationPromise: Promise<void> | null = null;

  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this.performInitialization();
    await this.initializationPromise;
    this.isInitialized = true;
  }

  private async performInitialization(): Promise<void> {
    try {
      automationLogger.info('system', 'Starting platform initialization and filtration');

      // Step 1: Filter platforms automatically
      const filterResults = await automaticUrlFilterService.filterAllPlatforms();
      
      automationLogger.info('system', 'Platform filtration completed', {
        total: filterResults.totalTested,
        working: filterResults.passed,
        removed: filterResults.failed,
        workingPlatforms: filterResults.kept
      });

      // Step 2: Override target sites with only working platforms
      await automaticUrlFilterService.overrideTargetSites();

      // Step 3: Validate the working platforms
      const workingPlatforms = await automaticUrlFilterService.getWorkingPlatforms();
      
      if (workingPlatforms.length === 0) {
        automationLogger.warn('system', 'No working platforms found - system may have limited functionality');
      } else {
        automationLogger.info('system', `Platform initialization complete - ${workingPlatforms.length} working platforms available`, {
          platforms: workingPlatforms.map(p => p.domain)
        });
      }

      // Step 4: Set up periodic filtration (every 6 hours)
      if (typeof window !== 'undefined') {
        setInterval(() => {
          this.runPeriodicCheck();
        }, 6 * 60 * 60 * 1000); // 6 hours
      }

    } catch (error) {
      automationLogger.error('system', 'Platform initialization failed', {}, undefined, error as Error);
      
      // Fallback to Telegraph only if initialization fails
      await this.fallbackToTelegraphOnly();
    }
  }

  private async runPeriodicCheck(): Promise<void> {
    try {
      automationLogger.info('system', 'Running periodic platform validation');
      
      const results = await automaticUrlFilterService.runPeriodicFiltration();
      
      if (results.failed > 0) {
        automationLogger.warn('system', `Periodic check found ${results.failed} failed platforms`, {
          failed: results.removed,
          working: results.kept
        });
        
        // Update target sites if platforms failed
        await automaticUrlFilterService.overrideTargetSites();
      }
      
    } catch (error) {
      automationLogger.error('system', 'Periodic platform check failed', {}, undefined, error as Error);
    }
  }

  private async fallbackToTelegraphOnly(): Promise<void> {
    automationLogger.warn('system', 'Falling back to Telegraph-only configuration');
    
    // Override with only Telegraph as it's the most reliable
    await automaticUrlFilterService.overrideTargetSites();
  }

  // Get current platform status
  async getPlatformStatus(): Promise<{
    initialized: boolean;
    workingPlatforms: string[];
    totalPlatforms: number;
    lastCheck: string;
  }> {
    const summary = await automaticUrlFilterService.getPlatformSummary();
    
    return {
      initialized: this.isInitialized,
      workingPlatforms: summary.workingPlatforms,
      totalPlatforms: summary.total,
      lastCheck: new Date().toISOString()
    };
  }

  // Force re-initialization
  async reinitialize(): Promise<void> {
    this.isInitialized = false;
    this.initializationPromise = null;
    await this.initialize();
  }

  // Test if platforms are working
  async testPlatforms(): Promise<boolean> {
    try {
      const workingPlatforms = await automaticUrlFilterService.getWorkingPlatforms();
      return workingPlatforms.length > 0;
    } catch (error) {
      automationLogger.error('system', 'Platform test failed', {}, undefined, error as Error);
      return false;
    }
  }

  // Get safe recommendations
  async getSafeTargetPlatforms(): Promise<string[]> {
    const workingPlatforms = await automaticUrlFilterService.getWorkingPlatforms();
    return workingPlatforms.map(p => p.domain);
  }
}

export const platformInitializer = new PlatformInitializer();

// Auto-initialize on import in browser environment
if (typeof window !== 'undefined') {
  // Initialize after a brief delay to allow other services to load
  setTimeout(() => {
    platformInitializer.initialize().catch(error => {
      console.error('Platform initialization failed:', error);
    });
  }, 1000);
}

// Export for window debugging in development
if (typeof window !== 'undefined' && import.meta.env.MODE === 'development') {
  (window as any).platformInitializer = platformInitializer;
  console.log('🔧 Platform initializer available at window.platformInitializer');
}

export default platformInitializer;
