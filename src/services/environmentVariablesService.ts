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
    // First check runtime environment variables
    const envValue = import.meta.env[key];
    if (envValue) {
      return envValue;
    }

    // Then check cache
    if (this.cache.has(key) && Date.now() - this.lastFetch < this.CACHE_DURATION) {
      return this.cache.get(key) || null;
    }

    // Fetch from database
    await this.refreshCache();
    return this.cache.get(key) || null;
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
      const { data, error } = await supabase
        .from('admin_environment_variables')
        .select('key, value');

      if (error) {
        console.warn('Could not fetch environment variables from database:', error);
        return;
      }

      // Update cache
      this.cache.clear();
      data?.forEach((item: any) => {
        this.cache.set(item.key, item.value);
      });

      this.lastFetch = Date.now();
      console.log('✅ Environment variables cache refreshed');
    } catch (error) {
      console.warn('Error refreshing environment variables cache:', error);
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
