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
    // Priority: Environment variables (Edge Function Secrets) first
    const envValue = import.meta.env[key];
    if (envValue) {
      console.log('✅ Environment variable found:', envValue.substring(0, 15) + '...');
      return envValue;
    }

    // Fallback to localStorage cache for backwards compatibility
    if (this.cache.has(key)) {
      const cached = this.cache.get(key);
      if (cached) {
        console.log('✅ Variable found in cache:', cached.substring(0, 15) + '...');
        return cached;
      }
    }

    // Load from localStorage if not in memory cache
    this.loadFromLocalStorage();
    const localValue = this.cache.get(key);
    if (localValue) {
      console.log('✅ Variable found in localStorage:', localValue.substring(0, 15) + '...');
      return localValue;
    }

    console.log('❌ No variable found for key:', key);
    return null;
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
        // Extract meaningful error message
        let errorMessage = 'Database error occurred';

        if (error.message) {
          errorMessage = error.message;
        } else if (error.details) {
          errorMessage = error.details;
        } else if (error.code) {
          errorMessage = `Database error code: ${error.code}`;
        }

        // Check for common database issues
        if (errorMessage.includes('does not exist') || errorMessage.includes('42P01')) {
          errorMessage = 'Database table "admin_environment_variables" does not exist. Please check your database setup.';
        } else if (errorMessage.includes('permission denied') || errorMessage.includes('insufficient_privilege')) {
          errorMessage = 'Database permission denied. Please check your Supabase configuration.';
        }

        throw new Error(`Database error: ${errorMessage}`);
      }

      // Update cache
      this.cache.set(key, value);
      console.log(`✅ Environment variable ${key} saved successfully`);
      return true;
    } catch (error) {
      console.error('Error in saveVariable:', error);

      // If it's already our custom error, re-throw it
      if (error instanceof Error && error.message.includes('Failed to save to database')) {
        throw error;
      }

      // For other errors, create a descriptive message
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(`Failed to save environment variable: ${errorMessage}`);
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
