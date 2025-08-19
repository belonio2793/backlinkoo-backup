import { BlogTheme } from './blogThemesService';

export interface BlogTemplateSettings {
  domainId: string;
  themeId: string;
  customStyles: Partial<BlogTheme['styles']>;
  customSettings: Record<string, any>;
  lastUpdated: string;
}

export class BlogTemplateStorageService {
  private static readonly STORAGE_KEY = 'blog-template-settings';
  private static readonly VERSION = '1.0';

  /**
   * Save blog template settings (with fallback to localStorage)
   */
  static async saveSettings(
    domainId: string,
    themeId: string,
    customStyles: Partial<BlogTheme['styles']> = {},
    customSettings: Record<string, any> = {}
  ): Promise<{ success: boolean; method: 'database' | 'localStorage'; error?: string }> {
    
    const settings: BlogTemplateSettings = {
      domainId,
      themeId,
      customStyles,
      customSettings,
      lastUpdated: new Date().toISOString()
    };

    // Try database first
    try {
      const { DomainBlogTemplateService } = await import('./domainBlogTemplateService');
      const success = await DomainBlogTemplateService.setDomainTheme(
        domainId,
        themeId,
        customStyles,
        customSettings
      );

      if (success) {
        // Also save to localStorage as backup
        this.saveToLocalStorage(settings);
        return { success: true, method: 'database' };
      }
    } catch (error) {
      console.warn('Database save failed, using localStorage:', error);
    }

    // Fallback to localStorage
    try {
      this.saveToLocalStorage(settings);
      return { success: true, method: 'localStorage' };
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      return { success: false, method: 'localStorage', error: errorMessage };
    }
  }

  /**
   * Load blog template settings (from database or localStorage)
   */
  static async loadSettings(domainId: string): Promise<BlogTemplateSettings | null> {
    // Try database first
    try {
      const { DomainBlogTemplateService } = await import('./domainBlogTemplateService');
      const dbRecord = await DomainBlogTemplateService.getDomainTheme(domainId);
      
      if (dbRecord) {
        const settings: BlogTemplateSettings = {
          domainId: dbRecord.domain_id,
          themeId: dbRecord.theme_id,
          customStyles: dbRecord.custom_styles || {},
          customSettings: dbRecord.custom_settings || {},
          lastUpdated: dbRecord.updated_at
        };
        return settings;
      }
    } catch (error) {
      console.warn('Database load failed, trying localStorage:', error);
    }

    // Fallback to localStorage
    return this.loadFromLocalStorage(domainId);
  }

  /**
   * Get all saved settings
   */
  static getAllSettings(): Record<string, BlogTemplateSettings> {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        if (data.version === this.VERSION && data.settings) {
          return data.settings;
        }
      }
    } catch (error) {
      console.warn('Error loading settings from localStorage:', error);
    }
    return {};
  }

  /**
   * Save to localStorage
   */
  private static saveToLocalStorage(settings: BlogTemplateSettings): void {
    try {
      const allSettings = this.getAllSettings();
      allSettings[settings.domainId] = settings;

      const dataToStore = {
        version: this.VERSION,
        settings: allSettings,
        lastModified: new Date().toISOString()
      };

      localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
      console.log(`✅ Saved blog template settings for domain ${settings.domainId} to localStorage`);
    } catch (error) {
      console.error('Failed to save to localStorage:', error);
      throw error;
    }
  }

  /**
   * Load from localStorage
   */
  private static loadFromLocalStorage(domainId: string): BlogTemplateSettings | null {
    try {
      const allSettings = this.getAllSettings();
      return allSettings[domainId] || null;
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
      return null;
    }
  }

  /**
   * Clear all settings
   */
  static clearAllSettings(): void {
    try {
      localStorage.removeItem(this.STORAGE_KEY);
      console.log('✅ Cleared all blog template settings');
    } catch (error) {
      console.warn('Error clearing settings:', error);
    }
  }

  /**
   * Export settings for backup
   */
  static exportSettings(): string {
    const allSettings = this.getAllSettings();
    return JSON.stringify({
      version: this.VERSION,
      exportDate: new Date().toISOString(),
      settings: allSettings
    }, null, 2);
  }

  /**
   * Import settings from backup
   */
  static importSettings(settingsJson: string): boolean {
    try {
      const importData = JSON.parse(settingsJson);
      if (importData.settings && typeof importData.settings === 'object') {
        const dataToStore = {
          version: this.VERSION,
          settings: importData.settings,
          lastModified: new Date().toISOString()
        };
        localStorage.setItem(this.STORAGE_KEY, JSON.stringify(dataToStore));
        console.log('✅ Imported blog template settings');
        return true;
      }
      return false;
    } catch (error) {
      console.error('Error importing settings:', error);
      return false;
    }
  }

  /**
   * Get storage method status
   */
  static async getStorageStatus(): Promise<{
    database: 'available' | 'unavailable' | 'unknown';
    localStorage: 'available' | 'unavailable';
    localSettingsCount: number;
  }> {
    let databaseStatus: 'available' | 'unavailable' | 'unknown' = 'unknown';
    
    try {
      const { supabase } = await import('@/integrations/supabase/client');
      const { data, error } = await supabase.from('domains').select('id').limit(1);
      databaseStatus = error ? 'unavailable' : 'available';
    } catch (error) {
      databaseStatus = 'unavailable';
    }

    let localStorageStatus: 'available' | 'unavailable' = 'available';
    let localSettingsCount = 0;

    try {
      const allSettings = this.getAllSettings();
      localSettingsCount = Object.keys(allSettings).length;
    } catch (error) {
      localStorageStatus = 'unavailable';
    }

    return {
      database: databaseStatus,
      localStorage: localStorageStatus,
      localSettingsCount
    };
  }
}

export default BlogTemplateStorageService;
