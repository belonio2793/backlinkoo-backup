/**
 * Environment Variables Service
 * Fetches environment variables from admin dashboard database
 */

import { supabase } from '@/integrations/supabase/client';

interface EnvironmentVariable {
  id: string;
  key: string;
  value: string;
  description?: string;
  is_secret: boolean;
  created_at: string;
  updated_at: string;
}

class EnvironmentVariablesService {
  private cache: Map<string, string> = new Map();
  private lastFetch: number = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  /**
   * Get environment variable value by key
   */
  async getVariable(key: string): Promise<string | null> {
    // Force refresh from database for API keys to get latest from Supabase
    if (key.includes('API_KEY')) {
      console.log('🔄 Force refreshing API key from Supabase database...');
      await this.refreshCache();
      const dbValue = this.cache.get(key);
      if (dbValue) {
        console.log('✅ API key found in Supabase database:', dbValue.substring(0, 15) + '...');
        return dbValue;
      }
    }

    // First check runtime environment variables
    const envValue = import.meta.env[key];
    if (envValue) {
      console.log('✅ API key found in environment variables:', envValue.substring(0, 15) + '...');
      return envValue;
    }

    // Then check cache
    if (this.cache.has(key) && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      const cached = this.cache.get(key);
      if (cached) {
        console.log('✅ API key found in cache:', cached.substring(0, 15) + '...');
        return cached;
      }
    }

    // Fetch from database
    await this.refreshCache();
    const dbValue = this.cache.get(key);
    if (dbValue) {
      console.log('✅ API key found after refresh:', dbValue.substring(0, 15) + '...');
    } else {
      console.log('❌ No API key found in any source');
    }
    return dbValue || null;
  }

  /**
   * Get multiple environment variables
   */
  async getVariables(keys: string[]): Promise<Record<string, string | null>> {
    const result: Record<string, string | null> = {};
    
    for (const key of keys) {
      result[key] = await this.getVariable(key);
    }
    
    return result;
  }

  /**
   * Refresh the cache with latest values from database
   */
  async refreshCache(): Promise<void> {
    try {
      console.log('🔄 Fetching environment variables from Supabase database...');
      const { data, error } = await supabase
        .from('admin_environment_variables')
        .select('key, value');

      if (error) {
        console.warn('Could not fetch environment variables from database, using localStorage fallback:', error);
        this.loadFromLocalStorage();
        return;
      }

      // Update cache
      this.cache.clear();
      data?.forEach((item: any) => {
        this.cache.set(item.key, item.value);
      });

      this.lastFetch = Date.now();
      console.log('✅ Environment variables cache refreshed from database');
      console.log('📊 Loaded variables:', data?.map((item: any) => item.key).join(', '));

      // Log API key status specifically
      const apiKey = this.cache.get('VITE_OPENAI_API_KEY');
      if (apiKey) {
        console.log('🔑 OpenAI API key loaded from database:', apiKey.substring(0, 15) + '...');
      } else {
        console.log('❌ No OpenAI API key found in database');
      }
    } catch (error) {
      console.warn('Error refreshing environment variables cache, using localStorage fallback:', error);
      this.loadFromLocalStorage();
    }
  }

  /**
   * Load environment variables from localStorage fallback
   */
  private loadFromLocalStorage(): void {
    try {
      const stored = localStorage.getItem('admin_env_vars');
      if (stored) {
        const vars = JSON.parse(stored);
        this.cache.clear();
        vars.forEach((item: any) => {
          this.cache.set(item.key, item.value);
        });
        console.log('✅ Environment variables loaded from localStorage fallback');
      }
    } catch (error) {
      console.warn('Error loading from localStorage:', error);
    }
  }

  /**
   * Get all environment variables (admin only)
   */
  async getAllVariables(): Promise<EnvironmentVariable[]> {
    try {
      const { data, error } = await supabase
        .from('admin_environment_variables')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) {
        console.error('Error fetching all environment variables:', error);
        return [];
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAllVariables:', error);
      return [];
    }
  }

  /**
   * Save environment variable (admin only)
   */
  async saveVariable(
    key: string, 
    value: string, 
    description?: string, 
    isSecret: boolean = true
  ): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_environment_variables')
        .upsert({
          key,
          value,
          description,
          is_secret: isSecret
        });

      if (error) {
        console.error('Error saving environment variable:', error);
        return false;
      }

      // Update cache
      this.cache.set(key, value);
      console.log(`✅ Environment variable ${key} saved successfully`);
      return true;
    } catch (error) {
      console.error('Error in saveVariable:', error);
      return false;
    }
  }

  /**
   * Delete environment variable (admin only)
   */
  async deleteVariable(key: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('admin_environment_variables')
        .delete()
        .eq('key', key);

      if (error) {
        console.error('Error deleting environment variable:', error);
        return false;
      }

      // Remove from cache
      this.cache.delete(key);
      console.log(`✅ Environment variable ${key} deleted successfully`);
      return true;
    } catch (error) {
      console.error('Error in deleteVariable:', error);
      return false;
    }
  }

  /**
   * Check if OpenAI API key is configured
   */
  async isOpenAIConfigured(): Promise<boolean> {
    const apiKey = await this.getVariable('VITE_OPENAI_API_KEY');
    return Boolean(apiKey && apiKey.startsWith('sk-'));
  }

  /**
   * Get OpenAI API key
   */
  async getOpenAIKey(): Promise<string | null> {
    return await this.getVariable('VITE_OPENAI_API_KEY');
  }

  /**
   * Clear cache (useful for testing)
   */
  clearCache(): void {
    this.cache.clear();
    this.lastFetch = 0;
  }
}

export const environmentVariablesService = new EnvironmentVariablesService();
